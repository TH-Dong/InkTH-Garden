---
title: "07 Logistics回归"
tags:
  - Classification
summary: "Logistics回归的来由,似然,正则化分析"
draft: false
---

## odds , log-odds
Logistic 回归的原始出发点：
$$
 x\xrightarrow{\text{linear score}} z = w^\top x+b \xrightarrow{\text{probability link}} p(x)
$$
本质是两层结构：
1. **线性部分**：提取“支持正类的证据强度”
2. **非线性映射**：把这个强度变成合法概率
Logistic 回归的核心任务不是简单分类，而是建模二分类的条件概率$P(y=1\mid x)$
? 我们应该对什么去做线性建模呢
**odds(胜算、优势比)** 定义为：$$
\text{odds}(x)=\frac{p}{1-p}
$$其中$p=P(y=1\mid x)$
odds 大于1表示正类更可能 odds小于1 表示负类更可能
但是odds只能取正数 $\text{odds}\in(0,+\infty)$ 线性模型希望输出是$\mathbb R$
因此我们尝试取一个对数 ：
$$
p\in(0,1)\quad \Longleftrightarrow\quad \log\frac{p}{1-p}\in\mathbb R
$$
这就把有界概率空间，变成了无界实数空间 我们称为log-odds
**如果我们假设 log-odds 对输入是线性的，那么 sigmoid 就不是拍脑袋选出来的，而是被推导出来的**
Logistic 回归的基本假设其实是：
$$
\log\frac{p(x)}{1-p(x)} = w^\top x+b
$$
==正类相对于负类的对数优势，是输入特征的线性函数==,每个特征 $x_j$ 对分类的作用，是在 log-odds 空间里线性叠加的
我们对上面的基本假设进行恒等变换,并且假设 $z=w^Tx+b$ 
可以得到$$p(x)=\frac{1}{1+e^{-z}}$$![[image-20.png|573]]
+ 通过数学推导 分类阈值 $p=0.5$与几何边界 $w^\top x+b=0$ 完全一致 因此即使输出的数学概率 但是决策边界仍然是线性的
+ 同时这个参数是有一定语义的：在其他变量不变时，$x_j$ 每增加 1 个单位，log-odds 增加 $w_j$

## Logistic
给定输入$x\in\mathbb R^d$，参数 $w\in\mathbb R^d$，偏置 $b\in\mathbb R$，定义线性打分：$z = w^\top x + b$
然后定义正类概率为：$P(y=1\mid x)=\sigma(w^\top x+b)$, 其中$\sigma(t)=\frac{1}{1+e^{-t}}$
于是负类概率自动为：$P(y=0\mid x)=1-\sigma(w^\top x+b)$
**计算线性score -> 映射成概率 -> 得到label的distribution**

+ 统计角度:
	当 $y\in\{0,1\}$ 时，二分类的条件分布可以统一写成：$$
	P(y\mid x)=p(x)^y(1-p(x))^{1-y}
	$$其中$p(x)=\sigma(w^\top x+b)$
+ 几何角度:
	因为 sigmoid 是严格单调递增的，所以：
	$\sigma(w^\top x+b)\ge 0.5 \quad \Longleftrightarrow \quad w^\top x+b\ge 0$
	因此分类边界满足：$$w^\top x+b=0$$
	这说明一个关键事实：
	**Logistic 回归虽然输出的是非线性概率，但它的决策边界仍然是线性的**
+ 参数分析
	**参数 w 的解释发生在 log-odds 层面，而不是概率层面。**  
	$w_j$ 表示特征增加 1 个单位时，对数胜算增加多少；对应地，odds 会乘上 $e^{w_j}$

## Logistics似然函数
考虑训练集：$\mathcal D=\{(x_i,y_i)\}_{i=1}^n$ 
认为每个样本的标签生成过程彼此独立$$
L(w,b)=\prod_{i=1}^n p_i^{y_i}(1-p_i)^{1-y_i}
$$取对数：$$
\ell(w,b)=\log L(w,b) = \log \prod_{i=1}^n p_i^{y_i}(1-p_i)^{1-y_i}
$$$$
\ell(w,b) = \sum_{i=1}^n \log\left(p_i^{y_i}(1-p_i)^{1-y_i}\right)
$$利用log函数的性质$$
\ell(w,b) = \sum_{i=1}^n \left[ y_i\log p_i + (1-y_i)\log(1-p_i) \right]
$$这就是 Logistic 回归的 **对数似然**
把 $p_i=\sigma(w^\top x_i+b)$ 代回去，可写成：
$$
\ell(w,b) = \sum_{i=1}^n \left[ y_i\log \sigma(w^\top x_i+b) + (1-y_i)\log\big(1-\sigma(w^\top x_i+b)\big) \right]
$$
我们可以分析这个likelihood function: 分析每一个sample
+ 当$y=1$时候 似然函数等价于 $\log p$ 
	如果真实标签是正类，模型就会因为给正类分配了多大概率 $p_i$ 而获得对应收益
+ 当$y=0$时候 似然函数等价于 $(1-y)\log(1-p)$
	即真实标签是负类时，鼓励模型让 $1-p_i$ 大，也就是让 $p_i$ 小

我们现在构建他的损失函数 即负对数似然$$
J(w,b)=−ℓ(w,b)
$$
于是得到：$$
J(w,b) = -\sum_{i=1}^n \left[ y_i\log p_i+(1-y_i)\log(1-p_i) \right]
$$
若再除以样本数 n，得到平均损失：$$\bar J(w,b) = -\frac{1}{n}\sum_{i=1}^n \left[ y_i\log p_i+(1-y_i)\log(1-p_i) \right]
$$
这就是二分类中最常见的 **binary cross-entropy / log loss** 的形式

我们从信息论的角度来观察 本质上就是cross-entropy的本质
衡量的是用模型分布描述真实分布的代价$$
H(q,p) = -\sum_{c\in\{0,1\}} q(c)\log p(c)
$$会自动退化成：若 y=1，就是 $-\log p$,  若 y=0，就是 $-\log(1-p)$
统一写起来正好就是：$-\big[y\log p+(1-y)\log(1-p)\big]$
因此最小化交叉熵，等价于让模型分布尽量逼近真实分布
同时信息论里面有 **交叉熵与 KL 的关系是**$$
H(q,p)=H(q)+D_{\mathrm{KL}}(q\|p)
$$**交叉熵同时是负对数似然、分布匹配目标和 KL 最小化的等价表达**


**? 为什么不再是平方误差了**
我们之前提到过 平方误差在概率视角来看 在线性回归模型里面对应的假设是：$$
y_i = w^\top x_i+b+\varepsilon_i,\quad \varepsilon_i\sim\mathcal N(0,\sigma^2)
$$对应的是噪声服从Guassian Distribution
但是在 Logistic 回归中：$$
y_i\mid x_i \sim \text{Bernoulli}(p_i)
$$**损失函数不是普适固定的，它应该和输出变量的概率模型相匹配**
极大似然的核心思想是：
> **既然模型对数据生成方式做了概率假设，就用数据反过来选择最支持这些观测的参数**
- 线性回归：高斯假设 $\rightarrow$ 最小二乘
- Logistic 回归：伯努利假设 $\rightarrow$ 负对数似然 / 交叉熵
- Poisson 回归：Poisson 假设 $\rightarrow$ 对应 Poisson 似然

## 优化视角
sigmoid 定义为：$\sigma(z)=\frac{1}{1+e^{-z}}$
它的导数是：$\sigma'(z)=\sigma(z)\big(1-\sigma(z)\big)$
也就是：$$\frac{dp_i}{dz_i}=p_i(1-p_i)$$单样本损失对 $p_i$ 的导数：$$
\frac{\partial \ell_i}{\partial p_i} = -\left(\frac{y_i}{p_i} - \frac{1-y_i}{1-p_i}\right)
$$进一步化简可以得到: $$\frac{\partial \ell_i}{\partial p_i} = -\frac{y_i-p_i}{p_i(1-p_i)} = \frac{p_i-y_i}{p_i(1-p_i)}$$
根据链式法则:$\frac{\partial \ell_i}{\partial z_i} = \frac{\partial \ell_i}{\partial p_i}\cdot \frac{dp_i}{dz_i}$
可以得到:$$\frac{\partial \ell_i}{\partial z_i}=p_i-y_i$$在 score 层面，单样本损失的梯度，恰好就是 预测概率 - 真实标签 
- 若 $p_i>y_i$，梯度为正，优化会倾向于把 $z_i$ 往下拉
- 若 $p_i<y_i$，梯度为负，优化会倾向于把 $z_i$ 往上推
- 若 $p_i=y_i$，这个样本在 score 层面没有一阶误差信号

进一步的 对 $w$求梯度$$
\frac{\partial \ell_i}{\partial w} = \frac{\partial \ell_i}{\partial z_i}\cdot \frac{\partial z_i}{\partial w} = (p_i-y_i)x_i
$$对$b$求梯度我们也可以得到$$\frac{\partial \ell_i}{\partial b}=p_i-y_i $$
**参数更新的方向，是由样本特征决定的；更新的强度，是由预测错误程度决定的**$$
\nabla_w J = \sum_{i=1}^n (p_i-y_i)x_i
$$同时我们可以去证明损失函数$J$ 是convex的
对单样本的loss Hessian（对 $w$ 的二阶导矩阵）为：$$
\nabla^2 \ell_i(w) = p_i(1-p_i)\,x_i x_i^\top
$$可以注意到$p_i(1-p_i)\geq 0$ $x_ix_i^T$是semi-define的 所以Hessian也是半正定的
非线性的output仍然可以得到convex的结果

**线性回归、感知机、Logistic 回归、SVM 共享同一个线性 score 骨架**
$$
z=w^\top x+b
$$
但对这个 score 的解释和训练目标不同

## 正则化Logistics
OLS中 我们面对的问题 矩阵病态导致结果不稳定

但是在Logistics里面 我们面对一个MLE倾向于参数推向无穷大的一个结果
对于一组参数$(w,b)$ 我们整体放大得到$(cw,cb),c>0$ 
对于正类的样本$p_i=\sigma(c(w^Tx_i+b))\rightarrow 1$ 原本就是正的 c越大 他就越大
同理 对于负样本 score是负的 放大后更负

但是对于分类边界来说 $w^Tx+b=0$ 因为两个参数同比放大 所以超平面实际上不改变
**在可分数据上，不带正则的 Logistic 回归往往没有有限的 MLE**
不是说它训练不了，而是说最优趋势会沿着某个方向把参数范数越推越大

> 在linear regression里面 Ridge在抑制小的奇异值方向上的噪声放大
> 在Logistics Regression里面 正则化在阻止模型把“训练集上更极端的概率”误当成“更好的泛化规律”

**对于L2正则化:**$$
J_{\text{L2}}(w,b) = -\sum_{i=1}^n \left[y_i\log p_i+(1-y_i)\log(1-p_i)\right] +\frac{\lambda}{2}\|w\|_2^2
$$优化目标从 **单纯似然最大化** 变成了 **似然提升的收益-参数放大的代价**
从梯度的角度来观察 加上 L2 后变成：$$
\nabla_w J_{\text{L2}} = \sum_{i=1}^n (p_i-y_i)x_i + \lambda w
$$后一项代表复杂度约束的回拉力 不希望参数远离0太多
Logistic 回归中的 L2 正则化可以更本质地理解为：控制 logit 的尺度，抑制训练集上的过度置信
**对于L1正则化:**$$
J_{\text{L1}}(w,b) = -\sum_{i=1}^n \left[y_i\log p_i+(1-y_i)\log(1-p_i)\right] +\lambda \|w\|_1
$$模型实际上被鼓励 只用少量的feature来解释log-odds 
更准确地说，L1 在这里是在鼓励：$$
\log\frac{p(x)}{1-p(x)}
$$只由少数坐标主导
对区分类别真正有用的信息，可能只集中在少数几个方向上；  
其余方向不值得让它们持续参与 log-odds 的构造
