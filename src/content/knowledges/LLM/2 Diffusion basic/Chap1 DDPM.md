---
title: "Chap1 DDPM"
tags:
  - Diffusion Model
  - Image Generation
summary: "引入diffusion model 讲解 DDPM 的forward和reverse,ELBO,Training and Inference"
draft: false
---

## 生成建模问题
1.生成建模问题
训练集中的样本可以看作是从某个未知的真实数据分布 $p_{\text{data}}(x)$ 中独立采样得到的
$$
\mathcal{D}=\{x_1,x_2,\dots,x_N\}, \qquad x_i \sim p_{\text{data}}(x)
$$
$p_{\text{data}}(x)$ 表示对真实世界中图像的分布 比如“猫的图像分布”“人脸图像分布”“自然风景图像分布”
**我们手中的训练集只是从这个真实分布中抽取出来的有限样本，并不是分布本身**

生成模型的目标 并非需要去求解 $p_{\text{data}}(x)=?$ 解析解
因为真实图像分布极其复杂，几乎不可能得到明确的封闭公式 

生成模型真正要学习的是近似分布：
$$
p_\theta(x) \approx p_{\text{data}}(x)
$$
让模型生成的样本分布 $p_\theta(x)$ 尽可能接近真实数据分布 $p_{\text{data}}(x)$ 
这样，当我们从模型中采样时，得到的新图像就会在**视觉风格、局部纹理、整体结构和语义内容上像真实数据**

2.噪声
现代图像生成通常从噪声开始，再逐步把噪声修正成图像
在diffusion中 纯噪声状态 $x^T$ 开始 经过一系列反向去噪步骤，逐渐得到清晰图像
$$
x_T \sim \mathcal{N}(0,I),
\qquad
x_T \rightarrow x_{T-1} \rightarrow \cdots \rightarrow x_0
$$
Why?
1. **噪声分布容易采样** 
	各维独立、均值为 0、方差为 1 采样方法成熟，概率密度明确，数学性质稳定
2. **噪声提供样本多样性**  
	如果输入总是同一个固定对象，比如完全相同的白色画布，并且后续生成过程也是确定性的，那么模型本质上是在计算一个固定函数 
	而如果输入是随机噪声 那么不同的 噪声输入 可以对应不同的生成结果
3. **高斯噪声使扩散模型的数学推导更可处理**
	加法、线性变换、条件分布和 KL 散度计算中具有良好的闭合性 不仅方便采样，也让扩散模型的训练目标、反向推断和损失函数都能被写成较清楚、可优化的形式

3.DDPM的两条路径
DDPM 将图像生成问题分解为两个相反方向的随机过程：一个是人为设计的前向加噪过程，另一个是需要学习的反向去噪过程
前向扩散过程：$q(x_{1:T}\mid x_0)$ 在给定真实图像$x_0$ 如何一步步把图像变成noise 这条路不需要去learn $q$是**已知的，人为规定**
$$
q(x_{1:T}\mid x_0)
=
\prod_{t=1}^{T} q(x_t\mid x_{t-1})
$$
反向去噪过程：$p_\theta(x_{0:T})$ 模型如何从噪声一步一步还原出图像 在看到当前的噪声图像$x_t$时 如何预测上一部更加干净的图像$x_{t-1}$ **不是人为知道的，而是模型要学习的**
$$
p_\theta(x_{0:T})
=
p(x_T)
\prod_{t=1}^{T}
p_\theta(x_{t-1}\mid x_t)
$$
这一个Notes的核心目标：
怎样把“学习反向去噪过程”转化成一个可训练的损失函数？

## 前向过程
图像向量：$x_{image} \in \mathbb R^{H\times W \times 3}$ 往往会flatten成高维vector
$$
x_0 \rightarrow x_1 \rightarrow x_2 \rightarrow \cdots \rightarrow x_T
$$
$$
\text{清晰图像}
\rightarrow
\text{轻微噪声图像}
\rightarrow
\text{中度噪声图像}
\rightarrow
\text{几乎纯噪声}
$$
1.前向过程设计成Markov Chain：
$$
q(x_{1:T}\mid x_0)
=
\prod_{t=1}^{T} q(x_t\mid x_{t-1})
$$
第 $t$ 的状态只直接依赖于上一步 $x_{t-1}$ 不直接依赖更早的状态
每一步加噪过程： 
$$
q(x_t\mid x_{t-1})
=
\mathcal{N}
\left(
x_t;
\sqrt{1-\beta_t}x_{t-1},
\beta_t I
\right)
$$
![[image.png|583x209]]
+ $\beta_t\in(0,1)$：第 t 步骤的噪声强度
+ $\sqrt{1-\beta_t}x_{t-1}$ ：保留下面的原图信号
+ $\beta_t I$ ： 加入的guassian noise的方差
通常采用重参数化技巧：
$$
x_t
=
\sqrt{1-\beta_t}x_{t-1}
+
\sqrt{\beta_t}\epsilon_t
$$
通常为了更加简洁的表示 我们定义 $\alpha_t = 1-\beta_t$
于是前向过程通常写成
$$
q(x_t\mid x_{t-1})
=
\mathcal{N}
\left(
x_t;
\sqrt{\alpha_t}x_{t-1},
(1-\alpha_t)I
\right)
$$
等价的采样形式：
$$
x_t
=
\sqrt{\alpha_t}x_{t-1}
+
\sqrt{1-\alpha_t}\epsilon_t,
\qquad
\epsilon_t\sim\mathcal{N}(0,I)
$$

2.variance preserving
为什么不直接设计成 $x_t=x_{t-1}+\epsilon_t$ 呢？
那么每一步都会让**图像的整体方差变大** 噪声不断累积，数值尺度会膨胀
我们可以假设 $x_{t-1}$ 的方差大致为 $I$ 而且 $\epsilon_t\sim \mathcal{N}(0,I)$ 
那么 $\operatorname{Var}(x_t)=\alpha_t I+(1-\alpha_t)I=I$ 
**加噪的同时控制了整体尺度：原始信号逐渐减少，噪声逐渐增加，但总方差保持稳定**

3.多步加噪的闭式公式 $q(x_t\mid x_0)$
训练时我们不希望每次都真的从 $x_0$ 一步步模拟到 $x_t$ 
我们希望 可以直接从 $x_0​$ 一步采样出任意时刻的 $x_t$
定义：累计信号保留率
$$
\bar{\alpha}_t
=
\prod_{s=1}^{t}\alpha_s
$$
可以推导得到：[[#^qDerivation]]
$$
q(x_t\mid x_0)
=
\mathcal{N}
\left(
x_t;
\sqrt{\bar{\alpha}_t}x_0,
(1-\bar{\alpha}_t)I
\right)
$$
等价的采样形式：
$$
x_t
=
\sqrt{\bar{\alpha}_t}x_0
+
\sqrt{1-\bar{\alpha}_t}\epsilon,
\qquad
\epsilon\sim\mathcal{N}(0,I)
$$
可以理解成： 
$$
x_t
=
\text{剩余图像信号}
+
\text{累积高斯噪声}
$$

$\bar{\alpha}_t=\alpha_1\alpha_2\cdots\alpha_t$ 的理解 表示从第 $0$ 步到第 $t$ 步，原始图像信号累计保留下来的比例

## 反向过程
从噪声开始，一步一步还原出图像
$$
x_T \rightarrow x_{T-1} \rightarrow \cdots \rightarrow x_0
$$
反向过程我们写成：
$$
p_\theta(x_{0:T})
=
p(x_T)
\prod_{t=1}^{T}
p_\theta(x_{t-1}\mid x_t)
$$
其中 $p(x_T)=\mathcal{N}(0,I)$ 而我们需要去**Learning**的便是 $p_\theta(x_{t-1}\mid x_t)$

DDPM通常把反向一步建模为：
$$
p_\theta(x_{t-1}\mid x_t)
=
\mathcal{N}
\left(
x_{t-1};
\mu_\theta(x_t,t),
\Sigma_\theta(x_t,t)
\right)
$$
我们作一定的简化：只用nn网络预测学习均值 $\mu$  固定方差
$$
p_\theta(x_{t-1}\mid x_t)
=
\mathcal{N}
\left(
x_{t-1};
\mu_\theta(x_t,t),
\sigma_t^2 I
\right)
$$

### 反向过程的Training
真实反向过程的**训练**中 我们知道原图 $x_0$ 也知道第 t 步的带噪图像 $x_t$ 然后需要去推导第 $t-1$步的图像分布 $x_{t-1}$ 所以**真实的反向分布实际上是一个前向后验分布** $q(x_{t-1}\mid x_t,x_0)$
而我们需要去学习 $p_\theta(x_{t-1}\mid x_t)$ 去逼近这个真实后验

我们可以精确的推导出这个后验分布 [[#^qPostDerivation]]
$$
q(x_{t-1}\mid x_t,x_0)
=
\mathcal{N}
\left(
x_{t-1};
\tilde{\mu}_t(x_t,x_0),
\tilde{\beta}_t I
\right)
$$
其中：
$$
\tilde{\beta}_t
=
\frac{1-\bar{\alpha}_{t-1}}{1-\bar{\alpha}_t}\beta_t
$$
$$
\tilde{\mu}_t(x_t,x_0)
=
\frac{
\sqrt{\bar{\alpha}_{t-1}}\beta_t
}{
1-\bar{\alpha}_t
}x_0
+
\frac{
\sqrt{\alpha_t}(1-\bar{\alpha}_{t-1})
}{
1-\bar{\alpha}_t
}x_t
$$
这是真实的反向一步扩散，但是他依赖于$x_0$ 原图 但是实际上我们 **在generating的过程中没有原图**
所以model只能去学习
$$
p_\theta(x_{t-1}\mid x_t)
\approx
q(x_{t-1}\mid x_t,x_0)
$$
来进行近似 这就是**反向过程的本质**

### 模型通常预测噪声 $\epsilon$（Inference）
我们前面提到了我们回去学习$p$ 但是我们进一步思考推导 我们可以发现==**只去学习噪声**就可以完成reverse model的建模==
前向过程有：
$$
x_t
=
\sqrt{\bar{\alpha}_t}x_0
+
\sqrt{1-\bar{\alpha}_t}\epsilon,
\qquad
\epsilon\sim \mathcal{N}(0,I)
$$
可以反解出原图像 $x_0$ 
$$
x_0
=
\frac{
x_t-\sqrt{1-\bar{\alpha}_t}\epsilon
}{
\sqrt{\bar{\alpha}_t}
}
$$
如果model能够预测出噪声 $\epsilon_\theta(x_t,t)\approx \epsilon$
那么我们就可以间接的estimate 原图：
$$
\hat{x}_0
=
\frac{
x_t-\sqrt{1-\bar{\alpha}_t}\epsilon_\theta(x_t,t)
}{
\sqrt{\bar{\alpha}_t}
}
$$
那么代入真实后验的公式得到：
$$
\mu_\theta(x_t,t)
=
\frac{1}{\sqrt{\alpha_t}}
\left(
x_t
-
\frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}}
\epsilon_\theta(x_t,t)
\right)
$$
所以反向采样一步可以建模成：
$$
x_{t-1}
=
\mu_\theta(x_t,t)
+
\sigma_t z,
\qquad
z\sim \mathcal{N}(0,I)
$$
即：
$$
x_{t-1}
=
\frac{1}{\sqrt{\alpha_t}}
\left(
x_t
-
\frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}}
\epsilon_\theta(x_t,t)
\right)
+
\sigma_t z
$$
+ 第一项负责去掉预测到的噪声
+ 第二项 $\sigma_t z$ 保持采样随机性


## ELBO
我们的理想目标是最大化对数似然：
$$
\log p_\theta(x_0)
$$
但是
$$
p_\theta(x_0)
=
\int p_\theta(x_{0:T})\,dx_{1:T}
$$
对所有latent variable积分是很困难的
所以 DDPM 使用**变分推断思想，引入一个已知的前向分布：** $q(x_{1:T}\mid x_0)$
然后构造 $\log p_\theta(x_0)$ 的下界，也就是 ELBO

### ELBO 的基本推导
从对数似然开始：
$$\log p_\theta(x_0) = \log \int p_\theta(x_{0:T}) \,dx_{1:T}$$
乘除同一个分布 $q(x_{1:T} \mid x_0)$：
$$\log p_\theta(x_0) = \log \int q(x_{1:T} \mid x_0) \frac{p_\theta(x_{0:T})}{q(x_{1:T} \mid x_0)} \,dx_{1:T}$$
把积分写成期望：
$$\log p_\theta(x_0) = \log \mathbb{E}_{q(x_{1:T} \mid x_0)} \left[ \frac{p_\theta(x_{0:T})}{q(x_{1:T} \mid x_0)} \right]$$
由Jensen 不等式：
$$\log \mathbb{E}[Y] \ge \mathbb{E}[\log Y]$$
所以：
$$\log p_\theta(x_0) \ge \mathbb{E}_{q(x_{1:T} \mid x_0)} \left[ \log \frac{p_\theta(x_{0:T})}{q(x_{1:T} \mid x_0)} \right]$$
右边就是 ELBO：
$$\mathcal{L}_{\text{ELBO}} = \mathbb{E}_{q} \left[ \log p_\theta(x_{0:T}) - \log q(x_{1:T} \mid x_0) \right]$$
训练时最大化 ELBO，就等价于尽量提高真实数据的似然下界。通常也会最小化负 ELBO：
$$-\mathcal{L}_{\text{ELBO}}$$
这就是变分损失

### ELBO 展开成 DDPM 形式
反向生成模型是：
$$p_\theta(x_{0:T}) = p(x_T) \prod_{t=1}^{T} p_\theta(x_{t-1} \mid x_t)$$
前向过程是：
$$q(x_{1:T} \mid x_0) = \prod_{t=1}^{T} q(x_t \mid x_{t-1})$$
代入 ELBO：
$$\mathcal{L}_{\text{ELBO}} = \mathbb{E}_{q} \left[ \log p(x_T) + \sum_{t=1}^{T} \log p_\theta(x_{t-1} \mid x_t) - \sum_{t=1}^{T} \log q(x_t \mid x_{t-1}) \right]$$
这个形式还不够直观  经过整理后，负 ELBO 可以拆成三类项：
$$-\mathcal{L}_{\text{ELBO}} = L_T + \sum_{t=2}^{T} L_{t-1} + L_0$$
其中：
- $L_T = D_{\mathrm{KL}}(q(x_T \mid x_0) \| p(x_T))$
- $L_{t-1} = D_{\mathrm{KL}}(q(x_{t-1} \mid x_t, x_0) \| p_\theta(x_{t-1} \mid x_t))$
- $L_0 = -\log p_\theta(x_0 \mid x_1)$
这三个部分含义不同
### $L_T$：终点噪声是否接近标准高斯
$$L_T = D_{\mathrm{KL}}(q(x_T \mid x_0) \| p(x_T))$$
它衡量前向过程最后得到的 $x_T$ 是否接近标准高斯噪声
因为：$p(x_T) = \mathcal{N}(0, I)$
而：$q(x_T \mid x_0) = \mathcal{N}(x_T; \sqrt{\bar{\alpha}_T}x_0, (1 - \bar{\alpha}_T)I)$
如果 $T$ 足够大，$\bar{\alpha}_T \approx 0$，那么：
$$q(x_T \mid x_0) \approx \mathcal{N}(0, I)$$
所以 $L_T$ 通常接近常数，不是训练重点

### $L_{t-1}$：学习反向去噪过程
最重要的是：
$$L_{t-1} = D_{\mathrm{KL}}(q(x_{t-1} \mid x_t, x_0) \| p_\theta(x_{t-1} \mid x_t))$$
它的意思是：
- **真实后验**：$q(x_{t-1} \mid x_t, x_0)$
- **模型反向过程**：$p_\theta(x_{t-1} \mid x_t)$
两者要尽量接近。这正好对应反向过程的学习目标
也就是说，ELBO 推导告诉我们：训练反向扩散模型，本质上是在每个时间步，让模型的反向一步分布逼近真实的前向后验 由于这两个分布都被建模成高斯分布：
$$q(x_{t-1} \mid x_t, x_0) = \mathcal{N}(\tilde{\mu}_t, \tilde{\beta}_t I)$$
$$p_\theta(x_{t-1} \mid x_t) = \mathcal{N}(\mu_\theta, \sigma_t^2 I)$$
两个高斯之间的 KL 散度可以化成均值误差和方差误差 如果方差固定，那么核心就是让：
$$\mu_\theta(x_t, t) \approx \tilde{\mu}_t(x_t, x_0)$$
### $L_0$：最终重建图像
$$L_0 = -\log p_\theta(x_0 \mid x_1)$$
它表示从轻微噪声图像 $x_1$ 恢复原图 $x_0$ 的负对数似然。可以理解为最后一步重建误差
在图像模型中，这一项与像素级重建有关实 际训练中，DDPM 常常使用简化目标，不单独强调这一项，而是统一用噪声预测损失来训练所有时间步

### ELBO 化成噪声预测 MSE
中间项是：
$$D_{\mathrm{KL}}(q(x_{t-1} \mid x_t, x_0) \| p_\theta(x_{t-1} \mid x_t))$$
如果固定方差，这个 KL 的主要部分是：
$$\left\| \tilde{\mu}_t(x_t, x_0) - \mu_\theta(x_t, t) \right\|^2$$
也就是让模型预测的反向均值接近真实后验均值
但是真实后验均值可以写成噪声形式：
$$\tilde{\mu}_t(x_t, x_0) = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}} \epsilon \right)$$
模型均值写成：
$$\mu_\theta(x_t, t) = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}} \epsilon_\theta(x_t, t) \right)$$
两者相减：
$$\tilde{\mu}_t - \mu_\theta = \frac{1}{\sqrt{\alpha_t}} \frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}} \left( \epsilon_\theta(x_t, t) - \epsilon \right)$$
所以：
$$\left\| \tilde{\mu}_t - \mu_\theta \right\|^2 = \frac{\beta_t^2}{\alpha_t(1-\bar{\alpha}_t)} \left\| \epsilon - \epsilon_\theta(x_t, t) \right\|^2$$
因此，优化反向均值等价于优化噪声预测误差，只是前面多了一个与时间步有关的权重
原始变分目标可以得到加权噪声 MSE：
$$\mathbb{E}_{x_0, t, \epsilon} \left[ w_t \left\| \epsilon - \epsilon_\theta(x_t, t) \right\|^2 \right]$$
而 DDPM 常用一个更简单的训练目标，去掉复杂权重：
$$\boxed{\mathcal{L}_{\text{simple}} = \mathbb{E}_{x_0, t, \epsilon} \left[ \left\| \epsilon - \epsilon_\theta(x_t, t) \right\|^2 \right]}$$
这就是最常见的 DDPM 噪声预测损失

## 训练和推理
训练过程中：
$$
\begin{aligned}
\max_{\theta}\ \log p_{\theta}(x_0)
&\;\Rightarrow\;
\max_{\theta}\ \mathcal{L}_{\mathrm{ELBO}}(x_0) \\[4pt]
&\;\Rightarrow\;
\min_{\theta}
D_{\mathrm{KL}}
\left(
q(x_{t-1}\mid x_t,x_0)
\;\middle\|\;
p_{\theta}(x_{t-1}\mid x_t)
\right) \\[4pt]
&\;\Rightarrow\;
\min_{\theta}
\left\|
\tilde{\mu}_t(x_t,x_0)
-
\mu_{\theta}(x_t,t)
\right\|^2 \\[4pt]
&\;\Rightarrow\;
\min_{\theta}
\left\|
\epsilon
-
\epsilon_{\theta}(x_t,t)
\right\|^2 .
\end{aligned}
$$
![[image-1.png]]

## 附录
1.$q(x_t\mid x_0)$ 的推导 ^qDerivation
$$
\begin{aligned}
x_t &= \sqrt{\alpha_t}\, x_{t-1} + \sqrt{1-\alpha_t}\,\epsilon_t \\

x_1 &= \sqrt{\alpha_1}\, x_0 + \sqrt{1-\alpha_1}\,\epsilon_1 \\

x_2 
&= \sqrt{\alpha_2}\, x_1 + \sqrt{1-\alpha_2}\,\epsilon_2 \\
&= \sqrt{\alpha_2}\left(\sqrt{\alpha_1}\, x_0 + \sqrt{1-\alpha_1}\,\epsilon_1\right) + \sqrt{1-\alpha_2}\,\epsilon_2 \\
&= \sqrt{\alpha_1 \alpha_2}\, x_0 
+ \sqrt{\alpha_2(1-\alpha_1)}\, \epsilon_1 
+ \sqrt{1-\alpha_2}\, \epsilon_2 \\


\end{aligned}
$$
噪声部分的方差 
$$
\alpha_2(1-\alpha_1)I
+
(1-\alpha_2)I
=
(1-\alpha_1\alpha_2)I
$$
所以： 
$$
x_2
=
\sqrt{\alpha_1\alpha_2}x_0
+
\sqrt{1-\alpha_1\alpha_2}\epsilon
$$
推广到一般 
$$
q(x_t\mid x_0)
=
\mathcal{N}
\left(
x_t;
\sqrt{\bar{\alpha}_t}x_0,
(1-\bar{\alpha}_t)I
\right)
$$


2.$q(x_{t-1}\mid x_t,x_0)$的推导 ^qPostDerivation
根据贝叶斯公式：
$$q(x_{t-1} \mid x_t, x_0) = \frac{q(x_t \mid x_{t-1})q(x_{t-1} \mid x_0)}{q(x_t \mid x_0)}$$
因为分母 $q(x_t \mid x_0)$ 对 $x_{t-1}$ 来说只是归一化常数，所以可以写成正比关系：

$$q(x_{t-1} \mid x_t, x_0) \propto q(x_t \mid x_{t-1})q(x_{t-1} \mid x_0)$$

这两个分布都是高斯分布
首先：
$$q(x_t \mid x_{t-1}) = \mathcal{N}(x_t; \sqrt{\alpha_t}x_{t-1}, \beta_t I)$$
其次：
$$q(x_{t-1} \mid x_0) = \mathcal{N}(x_{t-1}; \sqrt{\bar{\alpha}_{t-1}}x_0, (1 - \bar{\alpha}_{t-1})I)$$
两个高斯相乘，仍然得到高斯。因此：
$$q(x_{t-1} \mid x_t, x_0) = \mathcal{N}(x_{t-1}; \tilde{\mu}_t(x_t, x_0), \tilde{\beta}_t I)$$
令：

$$y = x_{t-1}$$

根据刚才的正比关系：

$$q(y \mid x_t, x_0) \propto q(x_t \mid y)q(y \mid x_0)$$
写成指数形式：

$$q(x_t \mid y) \propto \exp \left( -\frac{1}{2\beta_t} \left\| x_t - \sqrt{\alpha_t}y \right\|^2 \right) \\ q(y \mid x_0) \propto \exp \left( -\frac{1}{2(1-\bar{\alpha}_{t-1})} \left\| y - \sqrt{\bar{\alpha}_{t-1}}x_0 \right\|^2 \right)$$

两者相乘，相当于指数相加：

$$q(y \mid x_t, x_0) \propto \exp \left[ -\frac{1}{2\beta_t} \left\| x_t - \sqrt{\alpha_t}y \right\|^2 - \frac{1}{2(1-\bar{\alpha}_{t-1})} \left\| y - \sqrt{\bar{\alpha}_{t-1}}x_0 \right\|^2 \right]$$

只保留和 $y$ 有关的项。

第一项展开：

$$\left\| x_t - \sqrt{\alpha_t}y \right\|^2 = \alpha_t \|y\|^2 - 2\sqrt{\alpha_t}y^\top x_t + \text{const}$$

第二项展开：

$$\left\| y - \sqrt{\bar{\alpha}_{t-1}}x_0 \right\|^2 = \|y\|^2 - 2\sqrt{\bar{\alpha}_{t-1}}y^\top x_0 + \text{const}$$

所以指数中关于 $y$ 的二次项系数是：

$$\frac{\alpha_t}{\beta_t} + \frac{1}{1-\bar{\alpha}_{t-1}}$$

这就是高斯分布的精度，也就是方差的倒数。

因此：

$$\frac{1}{\tilde{\beta}_t} = \frac{\alpha_t}{\beta_t} + \frac{1}{1-\bar{\alpha}_{t-1}}$$

通分：

$$\frac{1}{\tilde{\beta}_t} = \frac{\alpha_t(1-\bar{\alpha}_{t-1}) + \beta_t}{\beta_t(1-\bar{\alpha}_{t-1})}$$

因为：

$$\beta_t = 1 - \alpha_t$$

所以分子为：

$$\alpha_t(1-\bar{\alpha}_{t-1}) + \beta_t = \alpha_t - \alpha_t\bar{\alpha}_{t-1} + 1 - \alpha_t = 1 - \alpha_t\bar{\alpha}_{t-1}$$

又因为：

$$\bar{\alpha}_t = \alpha_t\bar{\alpha}_{t-1}$$

所以：

$$1 - \alpha_t\bar{\alpha}_{t-1} = 1 - \bar{\alpha}_t$$

因此：

$$\frac{1}{\tilde{\beta}_t} = \frac{1 - \bar{\alpha}_t}{\beta_t(1 - \bar{\alpha}_{t-1})}$$

取倒数：

$$\tilde{\beta}_t = \frac{1 - \bar{\alpha}_{t-1}}{1 - \bar{\alpha}_t} \beta_t$$

这就是后验方差。
再看均值。
高斯分布的一般形式是：

$$\exp \left[ -\frac{1}{2} (Ay^\top y - 2y^\top b) \right]$$
对应的均值是：
$$A^{-1}b$$
这里：
$$A = \frac{\alpha_t}{\beta_t} + \frac{1}{1-\bar{\alpha}_{t-1}}$$
而一次项系数是：
$$b = \frac{\sqrt{\alpha_t}}{\beta_t}x_t + \frac{\sqrt{\bar{\alpha}_{t-1}}}{1-\bar{\alpha}_{t-1}}x_0$$
所以：
$$\tilde{\mu}_t(x_t, x_0) = A^{-1}b$$
代入 $A^{-1} = \tilde{\beta}_t$，得到：
$$\tilde{\mu}_t(x_t, x_0) = \tilde{\beta}_t \left( \frac{\sqrt{\alpha_t}}{\beta_t}x_t + \frac{\sqrt{\bar{\alpha}_{t-1}}}{1-\bar{\alpha}_{t-1}}x_0 \right)$$
再代入：
$$\tilde{\beta}_t = \frac{1 - \bar{\alpha}_{t-1}}{1 - \bar{\alpha}_t} \beta_t$$
得到：

$$\tilde{\mu}_t(x_t, x_0) = \frac{\sqrt{\alpha_t}(1 - \bar{\alpha}_{t-1})}{1 - \bar{\alpha}_t}x_t + \frac{\sqrt{\bar{\alpha}_{t-1}}\beta_t}{1 - \bar{\alpha}_t}x_0$$
这就是前向后验均值

