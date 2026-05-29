---
title: "00 DDPM和DDIM(VAE视角)"
tags:
  - Diffusion Model
  - Image Generation
summary: "从VAE视角来引入diffusion model 比较严谨的数学推导(比较早写的一份了 基于数学证明的严谨性放上来了 后面有更系统的引入角度)"
draft: false
---
## VAE到Diffusion
VAE的原理是通过一个encoder将data  $p(x)$映射到隐空间$p(z)$  同时通过一个decoder将$p(z)$里面的特征能够生成我们的图片$p(x)$
但是这引入了一个问题:
我们似乎只用了很少的几层layers就想要将$p(z)$来生成$p(x)$,这似乎看起来很难实现

因而我们引入扩散过程
$x_0$ orginal image
$x_T$ latent variable 我们选择$x_T \sim \mathcal N(0,I)$ 
$x_1,...x_{T-1}$  latent variable NOT white Guassian
$\begin{aligned} \text{forward from }\mathbf{x}_0\mathrm{to~}\mathbf{x}_T: & q_{\boldsymbol{\phi}}(\mathbf{x}_{0:T})=q(\mathbf{x}_0)\prod_{t=1}^Tq_{\boldsymbol{\phi}}(\mathbf{x}_t\mid\mathbf{x}_{t-1}), \\ \text{reverse from }\mathbf{x}_T\mathrm{to~}\mathbf{x}_0: & p_{\boldsymbol{\theta}}(\mathbf{x}_{0:T})=p(\mathbf{x}_T)\prod_{t=1}^Tp_{\boldsymbol{\theta}}(\mathbf{x}_{t-1}\mid\mathbf{x}_t). \end{aligned}$

通过转移概率分布 我们将这个generation process 分解成了许多小的task,同时,***我们不需要T个neural network来实现,我们只需要重复使用T次一个network即可***,这大大减少了我们所需要的计算量

通过Guassian的性质 如果你的似然和先验是Guassian 那么你的后验也将会是Guassian(这需要证明,But we only live so long ,we just skip the proof)
因此 如果每一个转移概率都是Guassian 那么最后的joint distribution也是Guassian,而Guassian只需要mean和variance两个量拟合 这大大减少了我们需要的计算量

## Building Blocks
Transition Block
![[image1.png]]
Initial Block
![[image2.png]]
Final Block
![[image3.png]]
都是通过Guassian拟合概率
### Transition Distribution
> Definition: Transition Distribution
> $q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})\overset{\mathrm{def}}{\operatorname*{=}}\mathcal{N}(\mathbf{x}_{t}\mid\sqrt{\alpha_{t}}\mathbf{x}_{t-1},(1-\alpha_{t})\mathbf{I})$

我们通过一个mean为$\sqrt{\alpha_t}x_{t-1}$ 和方差为$(1-\alpha_t)I$ 的Guassion来拟合我们的转移概率 **实际上就是在原来的基础上我们去加上白噪声**  
但是我们选择了一个scaling factor 这是为了防止在太多次的迭代之后会造成消失和爆炸

**我们接下来介绍一下这两个系数的来由**
我们考虑一个Guassian mixture model 在通过我们不断的加白噪声的过程中 我们可以得到他最后会趋近于一个Guassian
$\begin{aligned} \mathbf{x}_{t}\sim p_{t}(\mathbf{x})= & \pi_1\mathcal{N}(\mathbf{x}|\sqrt{\alpha_t}\mu_{1,t-1},\alpha_t\sigma_{1,t-1}^2+(1-\alpha_t)) \\ & +\pi_2\mathcal{N}(\mathbf{x}|\sqrt{\alpha_t}\mu_{2,t-1},\alpha_t\sigma_{2,t-1}^2+(1-\alpha_t)) \end{aligned}$

![[image4.png]]
下面我们将会给出他的Proof
**Proof:**
我们的采样步骤等价于这样:
$x_t=ax_{t-1}+b\epsilon_{t-1}$ where $\epsilon_{t-1}\sim\mathcal N(0,I)$ 
我们可以递归得到下面的式子
$$\begin{aligned}
\mathbf{x}_{t} & =a\mathbf{x}_{t-1}+b\boldsymbol{\epsilon}_{t-1} \\
 & =a(a\mathbf{x}_{t-2}+b\boldsymbol{\epsilon}_{t-2})+b\boldsymbol{\epsilon}_{t-1} \\
 & =a^2\mathbf{x}_{t-2}+ab\boldsymbol{\epsilon}_{t-2}+b\boldsymbol{\epsilon}_{t-1} \\
 & =: \\
 & =a^t\mathbf{x}_0+b\underbrace{\left[\boldsymbol{\epsilon}_{t-1}+a\boldsymbol{\epsilon}_{t-2}+a^2\boldsymbol{\epsilon}_{t-3}+\ldots+a^{t-1}\boldsymbol{\epsilon}_0\right]}_{\overset{\mathrm{def}}{\operatorname*{=}}\mathbf{w}_t}.
\end{aligned}$$
我们注意到后面是一些Guassian的和
他们的mean vector $\rm E[w_t]$ = 0(每个白噪声都是0均值)
他们的covariance matrix可以得到
$\begin{aligned} \mathrm{Cov}[\mathbf{w}_{t}] & \overset{\mathrm{def}}{\operatorname*{\operatorname*{=}}}\mathbb{E}[\mathbf{w}_t\mathbf{w}_t^T] \\ & =b^{2}(\mathrm{Cov}(\boldsymbol{\epsilon}_{t-1})+a^{2}\mathrm{Cov}(\boldsymbol{\epsilon}_{t-2})+\ldots+(a^{t-1})^{2}\mathrm{Cov}(\boldsymbol{\epsilon}_{0})) \\ & =b^2(1+a^2+a^4+\ldots+a^{2(t-1)})\mathbf{I} \\ & =b^2\cdot\frac{1-a^{2t}}{1-a^2}\mathbf{I}. \end{aligned}$
当t->0时,对于小于1的a我们有$a^t$->0 
因此当t趋近于无穷时 我们可以得到
$\text{lim}_{t->\infty}Cov[w_t]=\frac{b^2}{1-a^2}I$
我们想要的时这个协方差矩阵为$I$
因此我们只需要$b^2=1-a^2$
因此我们选择$a=\sqrt{\alpha}$和$b=\sqrt{1-\alpha}$
我们便得到了$\mathbf{x}_{t}=\sqrt{\alpha}\mathbf{x}_{t-1}+\sqrt{1-\alpha}\boldsymbol{\epsilon}_{t-1}.$
## Conditional Distribution
> Definition: Conditional Distribution
> $q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_0)=\mathcal{N}(\mathbf{x}_t\mid\sqrt{\overline{\alpha}}_t\mathbf{x}_0,(1-\overline{\alpha}_t)\mathbf{I}),$
> where $\sqrt{\bar{\alpha_t}}=\prod_{i=1}^t\alpha_i$   

我们接下来给出Proof:
**Proof:**
$\begin{aligned} \mathbf{x}_{t} & =\sqrt{\alpha_{t}}\mathbf{x}_{t-1}+\sqrt{1-\alpha_{t}}\mathbf{\epsilon}_{t-1} \\ & =\sqrt{\alpha_{t}}(\sqrt{\alpha_{t-1}}\mathbf{x}_{t-2}+\sqrt{1-\alpha_{t-1}}\boldsymbol{\epsilon}_{t-2})+\sqrt{1-\alpha_{t}}\boldsymbol{\epsilon}_{t-1} \\ & =\sqrt{\alpha_{t}\alpha_{t-1}}\mathbf{x}_{t-2}+\underbrace{\sqrt{\alpha_{t}}\sqrt{1-\alpha_{t-1}}\boldsymbol{\epsilon}_{t-2}+\sqrt{1-\alpha_{t}}\boldsymbol{\epsilon}_{t-1}}_{\mathbf{w}_{1}}. \end{aligned}$
 我们不用去关心mean 因为一定是0
 我们只需要去看covariance
 $\begin{aligned} \mathbb{E}[\mathbf{w}_{1}\mathbf{w}_{1}^{T}] & =[(\sqrt{\alpha_{t}}\sqrt{1-\alpha_{t-1}})^{2}+(\sqrt{1-\alpha_{t}})^{2}]\mathbf{I} \\ & =[\alpha_{t}(1-\alpha_{t-1})+1-\alpha_{t}]\mathbf{I}=[1-\alpha_{t}\alpha_{t-1}]\mathbf{I}. \end{aligned}$
 通过计算(没别的技术含量了 就是硬展开计算)
 $\begin{aligned} \mathbf{x}_{t} & =\sqrt{\alpha_{t}\alpha_{t-1}}\mathbf{x}_{t-2}+\sqrt{1-\alpha_{t}\alpha_{t-1}}\mathbf{\epsilon}_{t-2} \\ & =\sqrt{\alpha_{t}\alpha_{t-1}\alpha_{t-2}}\mathbf{x}_{t-3}+\sqrt{1-\alpha_{t}\alpha_{t-1}\alpha_{t-2}}\boldsymbol{\epsilon}_{t-3} \\ & =... \\ & =\left(\sqrt{\prod_{i=1}^{t}\alpha_{i}}\right)\mathbf{x}_{0}+\left(\sqrt{1-\prod_{i=1}^{t}\alpha_{i}}\right)\boldsymbol{\epsilon}_{0}. \end{aligned}$
 这便证毕
 
 我们可以通过下图来理解
![[image5.png]]
 **至此我们总结了扩散模型的大致过程:本质上就是通过不断加噪形成Guassian 同时我们解释了两个系数的由来**

## Evidence Lower Bound
### ELBO
**我们先给出ELBO** 然后给出解释和证明
>Definiton:
>$\mathrm{ELBO}_{\boldsymbol{\phi},\boldsymbol{\theta}}(\mathbf{x})=\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1}|\mathbf{x}_{0})}\left[\log\underbrace{p_{\boldsymbol{\theta}}(\mathbf{x}_{0}|\mathbf{x}_{1})}_{\text{how good the initial block is}}\right]$ 
		    $-\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{T-1}|\mathbf{x}_{0})}\left[\underbrace{\mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})\|p(\mathbf{x}_{T})\right)}_{\text{how good the final block is}}\right]$
		     $-\sum_{t=1}^{T-1}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1},\mathbf{x}_{t+1}|\mathbf{x}_{0})}\left[\underbrace{\mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})\|p_{\boldsymbol{\theta}}(\mathbf{x}_{t}|\mathbf{x}_{t+1})\right)}\right]$
		     
第一项Reconstruction(Initial Term):$\mathbb{E}_{q_{\phi}(\mathbf{x}_{1}|\mathbf{x}_{0})}\left[\log p_{\boldsymbol{\theta}}(\mathbf{x}_{0}|\mathbf{x}_{1})\right]$
期望里面的似然衡量的是我们能从$x_1$中recover我们的$x_0$的效果
同时我们的$x_1$是从前向过程中的$x_0$生成而来 因此需要在q这个分布里面进行取样.这里condition了$x_0$是必要的,因为我们需要知道原始的image是什么样子

第二项Prior Matching(Final Block):$-\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{T-1}|\mathbf{x}_0)}\left[\mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_T|\mathbf{x}_{T-1})\|p(\mathbf{x}_T)\right)\right]$
期望里面的q是我们生成$x_T$的前向过程最后一步 p是我们的隐空间 我们通常假设成白高斯噪声 我们想要这两个分布能够尽量相近 我们用KL-divergence的相反数来表示我们想要优化的目标 
同时 我们也需要知道$x_T$来自于哪里 这就是我们期望外面的q的来由

第三项Consistency(Transition Blocks):
$-\sum_{t=1}^{T-1}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1},\mathbf{x}_{t+1}|\mathbf{x}_{0})}\left[\mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})\|p_{\boldsymbol{\theta}}(\mathbf{x}_{t}|\mathbf{x}_{t+1})\right)\right]$
这个就是描述我们前向过程和反向过程之前的偏离 我们用KL-divengence来表示 同时也需要知道$x_{t-1}$和$x_{t+1}$的由来
### The Proof of ELBO
**通过了理性的理解这三项的由来,现在我们来对ELBO进行证明**
$$\begin{aligned}
\operatorname{log}p(\mathbf{x}) & =\log p(\mathbf{x}_{0}) \\
 & =\log\int p(\mathbf{x}_{0:T})d\mathbf{x}_{1:T} & & \text{(Marginalize by integrating over }\mathbf{x}_{1:T}) \\
 & =\log\int p(\mathbf{x}_{0:T})\frac{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}d\mathbf{x}_{1:T} & & (\text{Multiply and divide }q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})) \\
 & =\log\int q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})\left[\frac{p(\mathbf{x}_{0:T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\right]d\mathbf{x}_{1:T} & & \text{(Rearrange terms)} \\
 & =\log\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\frac{p(\mathbf{x}_{0:T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\right] & & (\text{Definition of expectation}).
\end{aligned}$$
我们通过Jensen's inequality 
$\log p(\mathbf{x})=\log\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\frac{p(\mathbf{x}_{0:T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\right]\geq\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\frac{p(\mathbf{x}_{0:T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\right]$
我们将p,q进行相应的展开
$p(\mathbf{x}_{0:T})=p(\mathbf{x}_T)\prod_{t=1}^Tp(\mathbf{x}_{t-1}|\mathbf{x}_t)=p(\mathbf{x}_T)p(\mathbf{x}_0|\mathbf{x}_1)\prod_{t=2}^Tp(\mathbf{x}_{t-1}|\mathbf{x}_t).$
$q_{\phi}(\mathbf{x}_{1:T}|\mathbf{x}_{0})=\prod_{t=1}^{T}q_{\phi}(\mathbf{x}_{t}|\mathbf{x}_{t-1})=q_{\phi}(\mathbf{x}_{T}|\mathbf{x}_{T-1})\prod_{t=1}^{T-1}q_{\phi}(\mathbf{x}_{t}|\mathbf{x}_{t-1}).$

然后带入我们原式子
$$\begin{aligned}
\operatorname{log}p(\mathbf{x}) & \geq\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{0:T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\right] \\
 & =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\frac{p(\mathbf{x}_T)p(\mathbf{x}_0|\mathbf{x}_1)\prod_{t=2}^Tp(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_T|\mathbf{x}_{T-1})\prod_{t=1}^{T-1}q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_{t-1})}\right] \\
 & =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{T})p(\mathbf{x}_{0}|\mathbf{x}_{1})\prod_{t=1}^{T-1}p(\mathbf{x}_{t}|\mathbf{x}_{t+1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})\prod_{t=1}^{T-1}q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})}\right] & & (\mathrm{shift~}t\mathrm{~to~}t+1) \\
 & =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{T})p(\mathbf{x}_{0}|\mathbf{x}_{1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})}\right]+\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\prod_{t=1}^{T-1}\frac{p(\mathbf{x}_{t}|\mathbf{x}_{t+1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})}\right] & & \text{(split expectation)}
\end{aligned}$$
我们先看第一项 可以把他分成两项
$\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{T})p(\mathbf{x}_{0}|\mathbf{x}_{1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})}\right]=\underbrace{\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log p(\mathbf{x}_{0}|\mathbf{x}_{1})\right]}_{\text{Reconstruction}}+\underbrace{\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})}\right]}_{\text{Prior Matching}}$
我们化简一下Reconstruction Term 因为只和$x_1$相关 所以我们化简成下式
$\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log p(\mathbf{x}_0|\mathbf{x}_1)\right]=\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_1|\mathbf{x}_0)}\left[\log p(\mathbf{x}_0|\mathbf{x}_1)\right]$
对于Prior Matching Term我们可以也同理也得到
$\mathbb{E}_{q_{\phi}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{T})}{q_{\phi}(\mathbf{x}_{T}|\mathbf{x}_{T-1})}\right]=\mathbb{E}_{q_{\phi}(\mathbf{x}_{T},\mathbf{x}_{T-1}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{T})}{q_{\phi}(\mathbf{x}_{T}|\mathbf{x}_{T-1})}\right]$
我们通过chain rule知道$q_{\boldsymbol{\phi}}(\mathbf{x}_{T},\mathbf{x}_{T-1}|\mathbf{x}_{0})=q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1},\mathbf{x}_{0})q_{\boldsymbol{\phi}}(\mathbf{x}_{T-1}|\mathbf{x}_{0})$
我们知道q是Markovian的
我们可以有$q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1},\mathbf{x}_{0})=q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})$
因此我们可以改写我们的期望公式 最后化简成KL-divengence的形式
$\begin{aligned} \mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{T},\mathbf{x}_{T-1}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})}\right] & =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{T-1}|\mathbf{x}_{0})}\left\{\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})}\left[\log\frac{p(\mathbf{x}_{T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})}\right]\right\} \\ & =-\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{T-1}|\mathbf{x}_{0})}\left[\mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{T-1})\|p(\mathbf{x}_{T})\right)\right]. \end{aligned}$
我们接下来看product term
用同样的利用只和$x_{t-1},x_t,x_{t+1}$相关 和chain rule 我们可以得到
$\begin{aligned} \mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\prod_{t=1}^{T-1}\frac{p(\mathbf{x}_{t}|\mathbf{x}_{t+1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})}\right] & =\sum_{t=1}^{T-1}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{t}|\mathbf{x}_{t+1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})}\right] \\ & =\sum_{t=1}^{T-1}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1},\mathbf{x}_{t},\mathbf{x}_{t+1}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{t}|\mathbf{x}_{t+1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})}\right] \end{aligned}$
$\begin{aligned} \sum_{t=1}^{T-1}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1},\mathbf{x}_{t},\mathbf{x}_{t+1}|\mathbf{x}_{0})}\left[\operatorname{log}\frac{p(\mathbf{x}_{t}|\mathbf{x}_{t+1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})}\right] & =\sum_{t=1}^{T-1}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1},\mathbf{x}_{t+1}|\mathbf{x}_{0})}\left\{\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{t}|\mathbf{x}_{t+1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})}\right]\right\} \\ & =-\sum_{t=1}^{T-1}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1},\mathbf{x}_{t+1}|\mathbf{x}_{0})}\left[\mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1})\|p(\mathbf{x}_{t}|\mathbf{x}_{t+1})\right)\right]. \end{aligned}$

### Rewrite the Consistency Term
在我们推导ELBO的时候我们其实面临着一个问题:
我们想要从该$q_{\phi}(x_{t-1},x_{t+1}|x_0)$中取样得到$(x_{t-1},x_{t+1})$
通过MCMC采样两个随机变量 会导致更大的方差 优化过程会更加不稳定 我们采取下面的优化方式
首先根据Markov性质:
$q(x_t|x_{t-1})=q(x_t|x_{t-1},x_0)$
同时根据Bayes,可以得到
$q(x_t|x_{t-1},x_0)=\frac{q(x_{t-1}\mid x_t,x_0)q(x_t\mid x_0)}{q(x_{t-1}\mid x_0)}$
我们将两个反向的过程给变成了同向的过程
![[image6.png]]
我们定义我们新的ELBO
>Definition:
>$$\begin{aligned}
\operatorname{ELBO}_{\boldsymbol{\phi},\boldsymbol{\theta}}(\mathbf{x}) & =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_1|\mathbf{x}_0)}[\log\underbrace{p_{\boldsymbol{\theta}}(\mathbf{x}_0|\mathbf{x}_1)}_{\text{same as before}}]-\underbrace{\mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_T|\mathbf{x}_0)\|p(\mathbf{x}_T)\right)}_{\text{new prior matching}} \\
 & -\sum_{t=2}^T\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_0)}\left[\underbrace{\mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)\|p_{\boldsymbol{\theta}}(\mathbf{x}_{t-1}|\mathbf{x}_t)\right)}_{\text{new consistency}}\right]
\end{aligned}$$

我们一共修改了两项
Prior Matching Term: 我们现在前向生成$x_T$  condition on $x_0$ 所以不用再次在外面求期望了
Consistency Term: 这下我们需要采样的变量只剩下一个了 这样我们训练时就更加方便

下面我们通过代数角度来证明我们新的ELBO
事实上这个证明过程我们不用太深究
主要是概率公式的计算,理解即可
$\begin{gathered} \operatorname{log}p(\mathbf{x})\geq\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\operatorname{log}\frac{p(\mathbf{x}_{0:T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\right] \\ =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\frac{p(\mathbf{x}_T)p(\mathbf{x}_0|\mathbf{x}_1)\prod_{t=2}^Tp(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_1|\mathbf{x}_0)\prod_{t=2}^Tq_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_{t-1},\mathbf{x}_0)}\right]\text{(split the chain)} \\ =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\frac{p(\mathbf{x}_T)p(\mathbf{x}_0|\mathbf{x}_1)}{q_{\boldsymbol{\phi}}(\mathbf{x}_1|\mathbf{x}_0)}\right]+\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\prod_{t=2}^T\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_{t-1},\mathbf{x}_0)}\right] \end{gathered}$
我们来分析一下第二项
$$\begin{aligned}
\prod_{t=2}^T\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_{t-1},\mathbf{x}_0)} & =\prod_{t=2}^{T}\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_{t})}{\frac{q_{\phi}(\mathbf{x}_{t-1}|\mathbf{x}_{t},\mathbf{x}_{0})q_{\phi}(\mathbf{x}_{t}|\mathbf{x}_{0})}{q_{\phi}(\mathbf{x}_{t-1}|\mathbf{x}_{0})}} & \text{(Bayes rule)} \\
 & =\prod_{t=2}^T\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)}\times\prod_{t=1}^T\frac{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_0)}{q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_0)} & \text{( Rearrange denominator)} \\
 & =\prod_{t=2}^T\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)}\times\frac{q_{\boldsymbol{\phi}}(\mathbf{x}_1|\mathbf{x}_0)}{q_{\boldsymbol{\phi}}(\mathbf{x}_T|\mathbf{x}_0)}, & \text{( Recursion cancels terms)}
\end{aligned}$$
回到我们两个期望相加的分析
$$\begin{aligned}
 & \mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\operatorname{log}\frac{p(\mathbf{x}_{T})p(\mathbf{x}_{0}|\mathbf{x}_{1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{1}|\mathbf{x}_{0})}\right]+\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\operatorname{log}\prod_{t=2}^{T}\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_{t})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t}|\mathbf{x}_{t-1},\mathbf{x}_{0})}\right] \\
 & =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\frac{p(\mathbf{x}_T)p(\mathbf{x}_0|\mathbf{x}_1)}{q_{\boldsymbol{\phi}}(\mathbf{x}_1|\mathbf{x}_0)}+\log\frac{q_{\boldsymbol{\phi}}(\mathbf{x}_1|\mathbf{x}_0)}{q_{\boldsymbol{\phi}}(\mathbf{x}_T|\mathbf{x}_0)}\right]+\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\prod_{t=2}^T\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)}\right] \\
 & =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\frac{p(\mathbf{x}_T)p(\mathbf{x}_0|\mathbf{x}_1)}{q_{\boldsymbol{\phi}}(\mathbf{x}_T|\mathbf{x}_0)}\right]+\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_0)}\left[\log\prod_{t=2}^T\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)}\right]
\end{aligned}$$
我们来分析第一项 通过对数性质可以得到
$$\begin{aligned}
\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log\frac{p(\mathbf{x}_{T})p(\mathbf{x}_{0}|\mathbf{x}_{1})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{0})}\right] & =\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\log p(\mathbf{x}_{0}|\mathbf{x}_{1})\right]+\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left\lfloor\log\frac{p(\mathbf{x}_{T})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{T}|\mathbf{x}_{0})}\right\rfloor \\
 & =\underbrace{\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_1|\mathbf{x}_0)}\left[\log p(\mathbf{x}_0|\mathbf{x}_1)\right]}_{\text{reconstruction}}-\underbrace{\mathbb{D}_{\mathrm{KL}}(q_{\boldsymbol{\phi}}(\mathbf{x}_T|\mathbf{x}_0)\|p(\mathbf{x}_T))}_{\text{prior matching}}.
\end{aligned}$$
我们对第二项进行展开
$$\begin{aligned}
\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{1:T}|\mathbf{x}_{0})}\left[\operatorname{log}\prod_{t=2}^{T}\frac{p(\mathbf{x}_{t-1}}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|:}\right. & \left.\frac{\mathbf{x}_{t})}{\mathbf{x}_{t},\mathbf{x}_{0})}\right\rfloor=\sum_{t=2}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_{t},\mathbf{x}_{t-1}|\mathbf{x}_{0})}\operatorname{log}\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_{t})}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_{t},\mathbf{x}_{0})} \\
 & =\sum_{t=2}\int\int\log\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)}\cdot q_{\boldsymbol{\phi}}(\mathbf{x}_t,\mathbf{x}_{t-1}|\mathbf{x}_0)d\mathbf{x}_{t-1}d\mathbf{x}_t \\
 & =\sum_{t=2}\int\int\log\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)}\cdot q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_0)d\mathbf{x}_{t-1}d\mathbf{x}_t \\
 & 
\begin{aligned}
=\sum_{t=2}\int\left\{\int\log\frac{p(\mathbf{x}_{t-1}|\mathbf{x}_t)}{q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)}\cdot q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1},\mathbf{x}_t|\mathbf{x}_0)d\mathbf{x}_{t-1}\right\}q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_0)d\mathbf{x}_t
\end{aligned} \\
 & =-\underbrace{\sum_{t=2}\mathbb{E}_{q_{\boldsymbol{\phi}}(\mathbf{x}_t|\mathbf{x}_0)}\mathbb{D}_{\mathrm{KL}}(q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)\|p(\mathbf{x}_{t-1}|\mathbf{x}_t)).}
\end{aligned}$$

## Reverse Process
### 建模$q_{\phi}$
从上面的分析我们可以知道
为了更好的衡量p和q两个转移概率的KL散度
我们将q写成了逆向过程
对于我们新的转移概率$q_{\phi}(x_{t-1}|x_t,x_0)$ 我们需要得到他的递归式子
> Theorem:
> $$\begin{aligned}
 &   q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_{t},\mathbf{x}_{0})=\mathcal{N}(\mathbf{x}_{t-1}|\boldsymbol{\mu}_{q}(\mathbf{x}_{t},\mathbf{x}_{0}),\boldsymbol{\Sigma}_{q}(t)), \\
  \mathrm{where} \\
 &  \boldsymbol{\mu}_q(\mathbf{x}_t,\mathbf{x}_0)  
\begin{aligned}
 & =\frac{(1-\overline{\alpha}_{t-1})\sqrt{\alpha_t}}{1-\overline{\alpha}_t}\mathbf{x}_t+\frac{(1-\alpha_t)\sqrt{\overline{\alpha}_{t-1}}}{1-\overline{\alpha}_t}\mathbf{x}_0
\end{aligned} \\
  \boldsymbol{\Sigma}_q(t) & =\frac{(1-\alpha_t)(1-\sqrt{\overline{\alpha}_{t-1}})}{1-\overline{\alpha}_t}\mathbf{I}\overset{\mathrm{def}}{\operatorname*{=}}\sigma_q^2(t)\mathbf{I}, \\
 &\mathrm{where~}\overline{\alpha}_t=\prod_{i=1}^t\alpha_i.
\end{aligned}$$

我们也可以通过数学上的一些Trick来给出这个式子的Proof,但我们不会多说,我把原论文的Proof给复制上来
`
Proof of Theorem:

Using the Bayes theorem stated in Eqn (2.20), $q(x_{t-1}|x_t,x_0)$ can be determined if we evaluate the following product of Gaussians

$$\begin{aligned}
& q(x_{t-1}|x_t,x_0) = \frac{\mathcal{N}(x_t|\sqrt{\alpha_t} x_{t-1},(1-\alpha_t)\mathbf{I})\mathcal{N}(x_{t-1}|\sqrt{\bar{\alpha}_{t-1}}x_0,(1-\bar{\alpha}_{t-1})\mathbf{I})}{\mathcal{N}(x_t|\sqrt{\bar{\alpha}_t}x_0,(1-\bar{\alpha}_t)\mathbf{I})}. \\
& (2.27)
\end{aligned}$$

For simplicity we will treat the vectors as scalars. Then the above product of Gaussians will become

$$q(x_{t-1}|x_t,x_0) \propto \exp\left\{\frac{(x_t - \sqrt{\alpha_t}x_{t-1})^2}{2(1-\alpha_t)} + \frac{(x_{t-1} - \sqrt{\bar{\alpha}_{t-1}}x_0)^2}{2(1-\bar{\alpha}_{t-1})} - \frac{(x_t - \sqrt{\bar{\alpha}_t}x_0)^2}{2(1-\bar{\alpha}_t)}\right\}. \\ 
(2.28)$$

We consider the following mapping:
$x = x_t, a = \alpha_t$
$y = x_{t-1}, b= \bar{\alpha}_{t-1}$ 
$z = x_0,  c = \bar{\alpha}_t$
Consider a quadratic function

$$f(y)=\frac{(x-\sqrt{ay})^2}{2(1-a)}+\frac{(y-\sqrt{bz})^2}{2(1-b)}-\frac{(x-\sqrt{cz})^2}{2(1-c)}.\\
(2.29)$$

We know that no matter how we rearrange the terms, the resulting function remains a quadratic equation. The minimizer of f(y) is the mean of the resulting Gaussian. So, we can calculate the derivative of f and show that

$$f'(y)=\frac{1-ab}{(1-a)(1-b)}y-\left(\frac{\sqrt{a}}{1-a}x+\frac{\sqrt{b}}{1-b}z\right).$$

Setting $f'(y)=0$ yields

$$y=\frac{(1-b)\sqrt{a}}{1-ab}x+\frac{(1-a)\sqrt{b}}{1-ab}z.$$

We note that $ab=\alpha_t\bar{\alpha}_{t-1}=\bar{\alpha}_t$. So,

$$\mu_q(x_t,x_0)=\frac{(1-\bar{\alpha}_{t-1})\sqrt{\alpha_t}}{1-\bar{\alpha}_t}x_t+\frac{(1-\alpha_t)\sqrt{\bar{\alpha}_{t-1}}}{1-\bar{\alpha}_t}x_0.$$
Similarly for the variance, we can check the curvature $f''(y)$. We can easily show that

$$f''(y)=\frac{1-ab}{(1-a)(1-b)}=\frac{1-\bar{\alpha}_t}{(1-\alpha_t)(1-\bar{\alpha}_{t-1})}.$$

Taking the reciprocal will give us

$$\Sigma_q(t)=\frac{(1-\alpha_t)(1-\bar{\alpha}_{t-1})}{1-\bar{\alpha}_t}\mathbf{I}.\\
(2.32)$$

我们来分析这mean和covariance:
![[image7.png]]
可以看到mean随着时间减小 与$x_0$相关性越来越高 但是和$x_t$的相关性却显著的降低了
![[image8.png]]
同时也可以看到随着时间减小 我们的cov也在趋近于0 这是我们想要的 因为我们想要clean image without noise
### 建模$p_{\theta}$ 
我们把q建模成立一个Guassian 最好的办法也是把p建模成一个Guassian 这样我们计算KL-divengence时会更加的方便
对于q来说:我们实际上只有参数$\alpha$ 通过确定$\alpha$我们就能确定q
对于p来说:我们主要来拟合mean 而cov我们直接拿原来的就行了
$q_{\phi}\left(\mathbf{x}_{t-1}|\mathbf{x}_{t},\mathbf{x}_{0}\right)=\mathcal{N}\left(\mathbf{x}_{t-1} \mid \underbrace{\boldsymbol{\mu}_{q}\left(\mathbf{x}_{t}, \mathbf{x}_{0}\right)}_{\text {known }}, \underbrace{\sigma_{q}^{2}(t) \mathbf{I}}_{\text {known }}\right),$

$p_{\theta}\left(\mathbf{x}_{t-1} \mid \mathbf{x}_{t}\right)=\mathcal{N}\left(\mathbf{x}_{t-1} \mid \underbrace{\boldsymbol{\mu}_{\theta}\left(\mathbf{x}_{t}\right)}_{\text {neural network }}, \underbrace{\sigma_{q}^{2}(t) \mathbf{I}}_{\text {known }}\right).$
那么我们的KL-divengence就可以化简成如下的式子
$$\begin{aligned}
 & \mathbb{D}_{\mathrm{KL}}\left(q_{\boldsymbol{\phi}}(\mathbf{x}_{t-1}|\mathbf{x}_{t},\mathbf{x}_{0})\parallel p_{\boldsymbol{\theta}}(\mathbf{x}_{t-1}|\mathbf{x}_{t})\right) \\
 & =\mathbb{D}_{\mathrm{KL}}\left(\mathcal{N}(\mathbf{x}_{t-1}\mid\boldsymbol{\mu}_q(\mathbf{x}_t,\mathbf{x}_0),\sigma_q^2(t)\mathbf{I})\parallel\mathcal{N}(\mathbf{x}_{t-1}\mid\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_t),\sigma_q^2(t)\mathbf{I})\right) \\
 & =\frac{1}{2\sigma_q^2(t)}\|\boldsymbol{\mu}_q(\mathbf{x}_t,\mathbf{x}_0)-\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_t)\|^2,
\end{aligned}$$
我们便得到了我们想要优化的ELBO的简化:
$$\begin{aligned}\operatorname{ELBO}_{\boldsymbol{\theta}}(\mathbf{x})&=\mathbb{E}_{q(\mathbf{x}_1|\mathbf{x}_0)}[\log p_{\boldsymbol{\theta}}(\mathbf{x}_0|\mathbf{x}_1)]-\underbrace{\mathbb{D}_{\mathrm{KL}}\left(q(\mathbf{x}_T|\mathbf{x}_0)\|p(\mathbf{x}_T)\right)}_{\text{nothing to train}}\\&-\sum_{t=2}^T\mathbb{E}_{q(\mathbf{x}_t|\mathbf{x}_0)}\Big[\frac1{2\sigma_q^2(t)}\|\boldsymbol{\mu}_q(\mathbf{x}_t,\mathbf{x}_0)-\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_t)\|^2\Big],\end{aligned}$$

${\mathrm{where~x=x_{0},~and~}\mathbf{x}_{T}\sim\mathcal{N}(0,\mathbf{I}).}$

## Training and Inference
### Optimization Goal
我们回顾我们的优化Goal:
$$\frac1{2\sigma_q^2(t)}\|\underbrace{\boldsymbol{\mu}_q(\mathbf{x}_t,\mathbf{x}_0)}_{\mathrm{known}}-\underbrace{\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_t)}_{\mathrm{network}}\|^2$$
其中第一项我们已经知道:
$$\boldsymbol{\mu}_q(\mathbf{x}_t,\mathbf{x}_0)=\frac{(1-\overline{\alpha}_{t-1})\sqrt{\alpha_t}}{1-\overline{\alpha}_t}\mathbf{x}_t+\frac{(1-\alpha_t)\sqrt{\overline{\alpha}_{t-1}}}{1-\overline{\alpha}_t}\mathbf{x}_0$$
第二项需要我们去设计这个网络 为了方便我们的计算 我们不妨将网络设计成下面的形式便于我们计算
$$\underbrace{\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_t)}_{\text{a network}}\stackrel{\mathrm{def}}{=}\frac{(1-\overline{\alpha}_{t-1})\sqrt{\alpha_t}}{1-\overline{\alpha}_t}\mathbf{x}_t+\frac{(1-\alpha_t)\sqrt{\overline{\alpha}_{t-1}}}{1-\overline{\alpha}_t}\underbrace{\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_t)}_{\text{another network}}$$
通过这样的设计我们的优化Goal被大大的化简了:
$$\begin{aligned}\frac1{2\sigma_q^2(t)}\|\boldsymbol{\mu}_q(\mathbf{x}_t,\mathbf{x}_0)-\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_t)\|^2&=\frac1{2\sigma_q^2(t)}\left\|\frac{(1-\alpha_t)\sqrt{\overline{\alpha}_{t-1}}}{1-\overline{\alpha}_t}(\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_t)-\mathbf{x}_0)\right\|^2\\&=\frac1{2\sigma_o^2(t)}\frac{(1-\alpha_t)^2\overline{\alpha}_{t-1}}{(1-\overline{\alpha}_t)^2}\left\|\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_t)-\mathbf{x}_0\right\|^2.\end{aligned}$$
同时回顾我们的ELBO
$$\mathrm{ELBO}_{\boldsymbol{\theta}}(\mathbf{x})=\mathbb{E}_{q(\mathbf{x}_{1}|\mathbf{x}_{0})}[\operatorname{log}p_{\boldsymbol{\theta}}(\mathbf{x}_{0}|\mathbf{x}_{1})]-\sum_{t=2}^{T}\mathbb{E}_{q(\mathbf{x}_{t}|\mathbf{x}_{0})}\left[\frac{1}{2\sigma_{q}^{2}(t)}\frac{(1-\alpha_{t})^{2}\overline{\alpha}_{t-1}}{(1-\overline{\alpha}_{t})^{2}}\left\|\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_{t})-\mathbf{x}_{0}\right\|^{2}\right]$$
其中第一项我们可以进行计算
$$\begin{aligned}
\operatorname{log}p_{\boldsymbol{\theta}}(\mathbf{x}_{0}|\mathbf{x}_{1}) & =\log\mathcal{N}(\mathbf{x}_0|\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_1),\sigma_q^2(1)\mathbf{I}) \\
 & =\log\frac{1}{(\sqrt{2\pi\sigma_q^2(1)})^d}\exp\left\{-\frac{\|\mathbf{x}_0-\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_1)\|^2}{2\sigma_q^2(1)}\right\} \\
 & =-\frac{\|\mathbf{x}_0-\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_1)\|^2}{2\sigma_q^2(1)}-\frac{d}{2}\operatorname{log}\left(2\pi\sigma_q^2(1)\right).
\end{aligned}$$
$$\begin{aligned}
\operatorname{log}p_{\boldsymbol{\theta}}(\mathbf{x}_{0}|\mathbf{x}_{1}) & =\log\mathcal{N}(\mathbf{x}_0|\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_1),\sigma_q^2(1)\mathbf{I})\propto-\frac{1}{2\sigma_q^2(1)}\|\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_1)-\mathbf{x}_0\| & & \text{(definition)} \\
 & =-\frac{1}{2\sigma_q^2(1)}\left\|\frac{(1-\overline{\alpha}_0)\sqrt{\alpha_1}}{1-\overline{\alpha}_1}\mathbf{x}_1+\frac{(1-\alpha_1)\sqrt{\overline{\alpha}_0}}{1-\overline{\alpha}_1}\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_1)-\mathbf{x}_0\right\|^2\quad\mathrm{(recall~}\alpha_0=1) \\
 & =-\frac{1}{2\sigma_q^2(1)}\left\|\frac{(1-\alpha_1)}{1-\overline{\alpha}_1}\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_1)-\mathbf{x}_0\right\|^2 \\
 & =-\frac{1}{2\sigma_q^2(1)}\left\|\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_1)-\mathbf{x}_0\right\|^2. & & (\mathrm{recall~}\overline{\alpha}_{1}=\alpha_{1})
\end{aligned}$$

他的大体形式实际上差不多 因此我们可以直接把他扔进我们的期望里面 这样我们得到了我们想要的优化目标
>Theorem. The  ELBO for denoising diffusion  probabilistic model is
>$$\mathrm{ELBO}_{\boldsymbol{\theta}}(\mathbf{x})=-\sum_{t=1}^T\frac{1}{2\sigma_q^2(t)}\frac{(1-\alpha_t)^2\overline{\alpha}_{t-1}}{(1-\overline{\alpha}_t)^2}\mathbb{E}_{q(\mathbf{x}_t|\mathbf{x}_0)}\left[\left\|\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_t)-\mathbf{x}_0\right\|^2\right]$$
>Ignore the constant and expectation:
>the main subject is:
>$$\underset{\theta}{\operatorname*{\operatorname*{argmin}}}\quad\left\|\widehat{\mathbf{x}}_{\boldsymbol{\theta}}(\mathbf{x}_t)-\mathbf{x}_0\right\|^2$$

现在我们再来具体的看看我们的优化目标
+ 一方面时$x_t$的得到 就是前向过程
$$\begin{aligned}
\mathbf{x}_{t}\sim q(\mathbf{x}_{t}|\mathbf{x}_{0}) & =\mathcal{N}(\mathbf{x}_t\mid\sqrt{\overline{\alpha}_t}\mathbf{x}_0,(1-\overline{\alpha}_t)\mathbf{I}) \\
\Leftrightarrow & \mathbf{x}_t=\sqrt{\overline{\alpha}_t}\mathbf{x}_0+\sqrt{(1-\overline{\alpha}_t)}\boldsymbol{\epsilon}_t,\quad\mathrm{where}\quad\boldsymbol{\epsilon}_t\sim\mathcal{N}(0,\mathbf{I}).
\end{aligned}$$
+ 另一方面我们来看看我们的系数$\frac{1}{2\sigma_{q}^{2}(t)}\frac{(1-\alpha_{t})^{2}\overline{\alpha}_{t-1}}{(1-\overline{\alpha}_{t})^{2}}$
这个系数向我们展现了每次去噪所占的权重并不等同 通过Monto Carlo 我们可以得到下面的优化问题
$$\begin{aligned}
 & \operatorname{\mathrm{argmax}}_{\boldsymbol{\theta}}\sum_{\mathbf{x}_{0}\in\mathcal{X}}\operatorname{\mathrm{ELBO}}(\mathbf{x}_{0}) \\
 & =\underset{\boldsymbol{\theta}}{\operatorname*{\operatorname*{argmin}}}\sum_{\mathbf{x}_0\in\mathcal{X}}\sum_{t=1}^T\mathbb{E}_{q(\mathbf{x}_t|\mathbf{x}_0)}\left[\frac{1}{2\sigma_q^2(t)}\frac{(1-\alpha_t)^2\overline{\alpha}_{t-1}}{(1-\overline{\alpha}_t)^2}\left\|\widehat{\mathbf{x}}_{\boldsymbol{\theta}}\left(\sqrt{\overline{\alpha}_t}\mathbf{x}_0+\sqrt{(1-\overline{\alpha}_t)}\mathbf{\epsilon}_t\right)-\mathbf{x}_0\right\|^2\right] \\
 & 
\begin{aligned}
=\underset{\boldsymbol{\theta}}{\operatorname*{\mathrm{argmin}}}\sum_{\mathbf{x}_0\in\mathcal{X}}\sum_{t=1}^T\frac{1}{M}\sum_{m=1}^M\frac{1}{2\sigma_q^2(t)}\frac{(1-\alpha_t)^2\overline{\alpha}_{t-1}}{(1-\overline{\alpha}_t)^2}\left\|\widehat{\mathbf{x}}_{\boldsymbol{\theta}}\left(\sqrt{\overline{\alpha}_t}\mathbf{x}_0+\sqrt{(1-\overline{\alpha}_t)}\boldsymbol{\epsilon}_t^{(m)}\right)-\mathbf{x}_0\right\|^2
\end{aligned}
\end{aligned}$$
where  $\epsilon_t^{(m)}\sim \mathcal N(0,I)$ 
我们可以看到 这个模型实际上就是在训练denoiser参数 $\theta$ 这也时我们最后的模型叫做**DDPM---denoising diffusion probabilistic model**的原因

### Architecture Review
+ Foward Diffusion in DDPM
![[image9.png]]
+ Training DDPM
![[image10.png]]

>Training Algorithm for DDPM. For every image x0 in your training dataset:
>+  Repeat the following steps until convergence.
>+  Pick a random time stamp t ~ Uniform[1,T].
>+  Draw a sample $x_t^{(m)} ~ N(x_t | \sqrt{\alpha_t} x_0, (1-\alpha_t)I), i.e.,$
>	$x_t^{(m)} = \bar{\alpha}_t x_0 + \sqrt{(1-\bar{\alpha}_t)} e_t^{(m)}, \quad e_t^{(m)} \sim \mathcal{N}(0,I).$
>+ Take gradient descent step on $$\nabla_θ \left\{  \frac{1}{M}\sum_{m=1}^{M} ||\hat{x}_θ(x_t^{(m)}) - x_0||^2 \right\}$$.
You can do this in batches, just like how you train any other neural networks. Note that, here, you are training **one denoising network** $\hat{x}_θ$ for **all noisy conditions**.

>`
Inference of DDPM.
>
>- You give us a white noise vector x_T ~ N(0, I).
>- Repeat the following for t = T, T - 1, ..., 1.
>- We calculate x̂_θ(x_t) using our trained denoiser.
>- Update according to
>
>$x_{t-1} = \frac{(1 - \bar{\alpha}_{t-1})\sqrt{\alpha_t}}{1 - \bar{\alpha}_t} x_t + \frac{(1 - \alpha_t)\sqrt{\bar{\alpha}_{t-1}}}{1 - \bar{\alpha}_t} \hat{x}_θ(x_t) + σ_q(t)ε,$
                         where  $ε \sim N(0, I).$

![[image11.png]]

## Original Paper of DDPM-Predicting Noise
我们尝试运用残差的思想来进一步改写我们的目标
$$\mathbf{x}_{t}=\sqrt{\overline{\alpha}_{t}}\mathbf{x}_{0}+\sqrt{1-\overline{\alpha}_{t}}\boldsymbol{\epsilon}_{0}
\\ \Rightarrow\quad\mathbf{x}_0=\frac{\mathbf{x}_t-\sqrt{1-\overline{\alpha}_t}\boldsymbol{\epsilon}_0}{\sqrt{\overline{\alpha}_t}}.$$
然后我们把$x_0$带入我们前向过程的均值的计算
$$\begin{aligned}
\boldsymbol{\mu}_{q}(\mathbf{x}_{t},\mathbf{x}_{0}) & 
\begin{aligned}
 & =\frac{\sqrt{\alpha_t}(1-\overline{\alpha}_{t-1})\mathbf{x}_t+\sqrt{\overline{\alpha}_{t-1}}(1-\alpha_t)\mathbf{x}_0}{1-\overline{\alpha}_t}
\end{aligned} \\
 & =\frac{\sqrt{\alpha_{t}}(1-\overline{\alpha}_{t-1})\mathbf{x}_{t}+\sqrt{\overline{\alpha}_{t-1}}(1-\alpha_{t})\cdot\frac{\mathbf{x}_{t}-\sqrt{1-\overline{\alpha}_{t}}\boldsymbol{\epsilon}_{0}}{\sqrt{\overline{\alpha}_{t}}}}{1-\overline{\alpha}_{t}} \\
 & =\text{a few more algebraic steps which we shall skip} \\
 & =\frac{1}{\sqrt{\alpha_{t}}}\mathbf{x}_{t}-\frac{1-\alpha_{t}}{\sqrt{1-\overline{\alpha}_{t}}\sqrt{\alpha}_{t}}\boldsymbol{\epsilon}_{0}.
\end{aligned}$$
这样我们的均值不再是$x_0$的function 
而是白噪声$\epsilon_0$的function
那么同样为了更好计算ELBO 我们重新设计我们的denoiser
我们将其设计成这样
$$\boldsymbol{\mu}_{\boldsymbol{\theta}}(\mathbf{x}_t)=\frac{1}{\sqrt{\alpha_t}}\mathbf{x}_t-\frac{1-\alpha_t}{\sqrt{1-\overline{\alpha}_t}\sqrt{\alpha}_t}\widehat{\boldsymbol{\epsilon}}_\boldsymbol{\theta}(\mathbf{x}_t).$$
那么我们的ELBO改写成
$$\begin{aligned}
\mathrm{ELBO}_{\boldsymbol{\theta}}(\mathbf{x}_0,\boldsymbol{\epsilon}_0) & 
\begin{aligned}
 & =-\sum_{t=1}^T\mathbb{E}_{q(\mathbf{x}_t|\mathbf{x}_0)}\left[\frac{1}{2\sigma_q^2(t)}\frac{(1-\alpha_t)^2}{(1-\overline{\alpha}_t)\alpha_t}\left\|\widehat{\boldsymbol{\epsilon}}_{\boldsymbol{\theta}}(\mathbf{x}_t)-\boldsymbol{\epsilon}_0\right\|^2\right]
\end{aligned} \\
 & =-\sum_{t=1}^T\mathbb{E}_{q(\mathbf{x}_t|\mathbf{x}_0)}\left[\frac{1}{2\sigma_q^2(t)}\frac{(1-\alpha_t)^2}{(1-\overline{\alpha}_t)\alpha_t}\left\|\widehat{\boldsymbol{\epsilon}}_{\boldsymbol{\theta}}\left(\sqrt{\overline{\alpha}_t}\mathbf{x}_0+\sqrt{1-\overline{\alpha}_t}\boldsymbol{\epsilon}_0\right)-\boldsymbol{\epsilon}_0\right\|^2\right]
\end{aligned}$$
$$\begin{aligned}
 & \underset{\boldsymbol{\theta}}{\operatorname*{\operatorname*{argmin}}}\quad\mathbb{E}_{\mathbf{x}_0,\boldsymbol{\epsilon}_0}\mathrm{ELBO}_{\boldsymbol{\theta}}(\mathbf{x}_0,\boldsymbol{\epsilon}_0) \\
 & \approx\underset{\boldsymbol{\theta}}{\operatorname*{\operatorname*{argmin}}}\sum_{\mathbf{x}_0\sim\mathcal{X}}\frac{1}{M}\sum_{m=1}^{M}\mathrm{ELBO}_{\boldsymbol{\theta}}(\mathbf{x}_0,\boldsymbol{\epsilon}_0^{(m)}),
\end{aligned}$$

那么现在我们的Training和inference
>Training DDPM using $\hat{e}_{\theta}(x_t)$. For every image $x_0$ in your training dataset:
>- Repeat the following steps until convergence.  
>- Pick a random time stamp $t \sim Uniform[1,T]$.  
>- Draw a sample $\epsilon_0 \sim N(0, I)$.  
>- Draw a sample $x_t \sim N(x_t | \sqrt{\overline{\alpha}_t} x_0, (1 - \overline{\alpha}_t) I)$, i.e.,  
>	$x_t = \sqrt{\overline{\alpha}_t} x_0 + \sqrt{(1 - \overline{\alpha}_t)} \epsilon_0$.  
>- Take gradient descent step on  
>	$\nabla_\theta \| \hat{\epsilon}_{\theta}(x_t) - \epsilon_0\|^2$.

>Inference of DDPM using $\hat{\epsilon}_{\theta}(x_t)$ 
    - You give us a white noise vector $x_T \sim \mathcal{N}(0,\mathbf{I})$.
    - Repeat the following for $t = T, T-1, \ldots, 1$.
    - We calculate $\hat{x}_\theta(x_t)$ using our trained denoiser.
    - Update according to
      $$x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{1-\alpha_t}{\sqrt{1-\bar{\alpha}_t}} \hat{e}_\theta(x_t) \right) + \sigma_q(t)\mathbf{z}, \quad \mathbf{z} \sim \mathcal{N}(0,\mathbf{I}).$$

## DDIM:Denosing Diffusion Implicit Model 
DDPM存在一些问题:在逆向扩散过程中我们需要迭代许多次才能得到一张图像 
事实上DDPM作为Markov chain 他的memoryless的性质简化了我们的计算 但同时也往往需要很多步才能够converge
而DDIM采用了non-Markovian的结构

现在我们开始讨论DDIM的probability distribution
为了简化计算 我们让转移概率的$\alpha$替换成ratio(只是为了接下来计算更加简便)
$$q(\mathbf{x}_t|\mathbf{x}_{t-1})\overset{\mathrm{def}}{\operatorname*{=}}\mathcal{N}\left(\mathbf{x}_t|\sqrt{\frac{\alpha_t}{\alpha_{t-1}}}\mathbf{x}_{t-1},(1-\frac{\alpha_t}{\alpha_{t-1}})\mathbf{I}\right).$$
那么我们可以得到
$$q(\mathbf{x}_t|\mathbf{x}_0)=\mathcal{N}\left(\mathbf{x}_t\mid\sqrt{\alpha_t}\mathbf{x}_0,(1-\alpha_t)\mathbf{I}\right).$$
通过Reparametrization Trick:
$$\mathbf{x}_t=\sqrt{\alpha_t}\mathbf{x}_0+\sqrt{1-\alpha_t}\boldsymbol{\epsilon},\quad\mathrm{where}\quad\boldsymbol{\epsilon}\sim\mathcal{N}(0,\mathbf{I}).$$
替换一下我们的t,我们可以得到:
$$\mathbf{x}_{t-1}=\sqrt{\alpha_{t-1}}\mathbf{x}_0+\sqrt{1-\alpha_{t-1}}\boldsymbol{\epsilon},\quad\mathrm{where}\quad\boldsymbol{\epsilon}\sim\mathcal{N}(0,\mathbf{I}).$$
接下来我们用一个小trick 我们想让$x_{t-1}$与白噪声不再有关
**高斯固然让我们的表达式更加简单,但这也正是我们reverse缓慢的原因**
我们可以对于$x_t$的表达式做如下的变形
$$\mathbf{x}_{t}=\sqrt{\alpha_{t}}\mathbf{x}_{0}+\sqrt{1-\alpha_{t}}\boldsymbol{\epsilon}
$$
$$\Longrightarrow\sqrt{1-\alpha_t}\boldsymbol{\epsilon}=\mathbf{x}_t-\sqrt{\alpha_t}\mathbf{x}_0$$
$$\Longrightarrow\epsilon=\frac{\mathbf{x}_t-\sqrt{\alpha_t}\mathbf{x}_0}{\sqrt{1-\alpha_t}}.$$
我们带入到$x_{t-1}$的式子里面
$$\begin{aligned}
\mathbf{x}_{t-1} & =\sqrt{\alpha_{t-1}}\mathbf{x}_{0}+\sqrt{1-\alpha_{t-1}}\boldsymbol{\epsilon} \\
 & =\sqrt{\alpha_{t-1}}\mathbf{x}_0+\sqrt{1-\alpha_{t-1}}\left(\frac{\mathbf{x}_t-\sqrt{\alpha_t}\mathbf{x}_0}{\sqrt{1-\alpha_t}}\right).
\end{aligned}$$
我们可以得到$x_{t-1}$的方程 其中方差我们先写成关于超参数$\sigma_t^2$的函数 
$$q(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)=\mathcal{N}\left(\sqrt{\alpha_{t-1}}\mathbf{x}_0+\sqrt{1-\alpha_{t-1}}\left(\frac{\mathbf{x}_t-\sqrt{\alpha_t}\mathbf{x}_0}{\sqrt{1-\alpha_t}}\right),\sigma_t^2\mathbf{I}\right)$$
我们想要$q(x_{t-1}|x_0)$能够满足$\mathcal N(\sqrt{\alpha_{t-1}} x_0,(1-\alpha_{t-1})I)$的形式 而通过我们新得到的$q(x_{t-1}|x_t,x_0)$我们可以通过marginalize来得到我们的目标
那么接下来我们进行一些代数上的分析
通过Bishop TextBook上的一个Theorem 我们知道

> $p(x) = \mathcal{N}(\mu, \Lambda^{-1}),$
>$p(y|x) = \mathcal{N}(Ax + b, L^{-1}).$
>Then we can show that the marginal distribution is
>$p(y) = \int p(y|x)p(x)dx = \mathcal{N}\left( A\mu + b, \quad L^{-1} + A\Lambda^{-1}A^{-1}\right).$

那么我们现在通过$q(x_t)$得到$\mu$和$\Lambda$
和$q(x_{t-1}|x_t,x_0)$的得到$A$和$b$和$L$
我们可以得到:
$$\mathbf{A}=\sqrt{\frac{1-\alpha_{t-1}}{1-\alpha_t}},\quad\boldsymbol{\mu}=\sqrt{\alpha_t}\mathbf{x}_0,\quad\mathbf{b}=\sqrt{\alpha_{t-1}}\mathbf{x}_0-\sqrt{\frac{1-\alpha_{t-1}}{1-\alpha_t}}\sqrt{\alpha_t}\mathbf{x}_0.$$
那么我们直接计算mean可以得到:
$$\begin{aligned}
\boldsymbol{\mu}_{t-1} & =\mathbf{A}\boldsymbol{\mu}+\mathbf{b} \\
 & =\sqrt{\frac{1-\alpha_{t-1}}{1-\alpha_{t}}}\cdot\sqrt{\alpha_{t}}\mathbf{x}_{0}+\sqrt{\alpha_{t-1}}\mathbf{x}_{0}-\sqrt{\frac{1-\alpha_{t-1}}{1-\alpha_{t}}}\sqrt{\alpha_{t}}\mathbf{x}_{0} \\
 & =\sqrt{\alpha_{t-1}}\mathbf{x}_{0}.
\end{aligned}$$
我们现在来计算variance
$$\begin{aligned}
\sigma_{t-1}^{2} & =\mathbf{L}^{-1}+\mathbf{A}\mathbf{\Lambda}^{-1}\mathbf{A}^T \\
 & =\sigma_{t}^{2}+\sqrt{\frac{1-\alpha_{t-1}}{1-\alpha_{t}}}\cdot(1-\alpha_{t})\cdot\sqrt{\frac{1-\alpha_{t-1}}{1-\alpha_{t}}} \\
 & =\sigma_{t}^{2}+(1-\alpha_{t-1}).
\end{aligned}$$
这和我们想要的$1-\alpha_{t-1}$有区别 多了一个$\sigma_t^2$的一项
但是修补这一项也很简单 我们只需要对A进行修改就可以了
$$\begin{aligned}
\sigma_{t-1}^{2} & 
\begin{aligned}
=\sigma_t^2+\sqrt{\frac{1-\alpha_{t-1}-\sigma_t^2}{1-\alpha_t}}\cdot(1-\alpha_t)\cdot\sqrt{\frac{1-\alpha_{t-1}-\sigma_t^2}{1-\alpha_t}}
\end{aligned} \\
 & =\sigma_t^2+1-\alpha_{t-1}-\sigma_t^2 \\
 & =1-\alpha_{t-1}.
\end{aligned}$$
修改后我们的$\sigma_t^2$是否会影响我们的mean呢 我们通过计算可以发现
$$\begin{aligned}
\boldsymbol{\mu}_{t-1} & =\mathbf{A}\boldsymbol{\mu}+\mathbf{b} \\
 & =\sqrt{\frac{1-\alpha_{t-1}-\sigma_t^2}{1-\alpha_t}}\cdot\sqrt{\alpha_t}\mathbf{x}_0+\sqrt{\alpha_{t-1}}\mathbf{x}_0-\sqrt{\frac{1-\alpha_{t-1}-\sigma_t^2}{1-\alpha_t}}\sqrt{\alpha_t}\mathbf{x}_0 \\
 & =\sqrt{\alpha_{t-1}}\mathbf{x}_0.
\end{aligned}$$
mean依旧保持原来的值
现在我们可以总结出来DDIM的转移分布
>Theorem DDIM Transition Distribution
>$$q(\mathbf{x}_{t-1}|\mathbf{x}_t,\mathbf{x}_0)=\mathcal{N}\left(\sqrt{\alpha_{t-1}}\mathbf{x}_0+\sqrt{1-\alpha_{t-1}-\sigma_t^2}\left(\frac{\mathbf{x}_t-\sqrt{\alpha_t}\mathbf{x}_0}{\sqrt{1-\alpha_t}}\right),\sigma_t^2\mathbf{I}\right)$$

>Theorem Inference for DDIM
>$$\mathrm{(DDIM)}\quad\mathbf{x}_{t-1}=\sqrt{\alpha_{t-1}}\underbrace{\left(\frac{\mathbf{x}_t-\sqrt{1-\alpha_t}\boldsymbol{\epsilon}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_t)}{\sqrt{\alpha_t}}\right)}_{\mathrm{predicted~}\mathbf{x}_0}+\underbrace{\sqrt{1-\alpha_{t-1}-\sigma_t^2}\cdot\boldsymbol{\epsilon}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_t)}_{\text{direction pointing to }\mathbf{x}_t}+\sigma_t\underbrace{\boldsymbol{\epsilon}_t}_{\sim\mathcal{N}(0,\mathbf{I})}$$

我们下面给出证明
根据前向过程的方程,如果我们想要perform reverse
我们可以得到:
$$\underbrace{\mathbf{x}_t}_{\mathrm{given}}=\underbrace{\sqrt{\alpha_t}\mathbf{x}_0}_{\text{want to find}}+\underbrace{\sqrt{1-\alpha_t}\boldsymbol{\epsilon}}_{\text{estimated by network}}.$$
通过重新组合这些terms
$$\mathbf{x}_{0}=\frac{1}{\sqrt{\alpha_{t}}}\left(\mathbf{x}_{t}-\sqrt{1-\alpha_{t}}\boldsymbol{\epsilon}\right)
$$$$
\Longrightarrow\quad f_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_{t})\overset{\mathrm{def}}{\operatorname*{=}}\frac{1}{\sqrt{\alpha_{t}}}\left(\mathbf{x}_{t}-\sqrt{1-\alpha_{t}}\boldsymbol{\epsilon}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_{t})\right).$$
这里我们将$\boldsymbol{\epsilon}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_{t})$用来作为我们用$x_t$来去拟合我们所需要添加的噪声
而我们将右边这个复杂的式子用$\boldsymbol{f}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_{t})$来表示
那么我们可以得到
$$\begin{aligned}
p_{\boldsymbol{\theta}}(\mathbf{x}_{t-1}|\mathbf{x}_{t}) & =q(\mathbf{x}_{t-1}|\mathbf{x}_{t},\mathbf{x}_{0}) \\
\implies\quad p_{\boldsymbol{\theta}}(\mathbf{x}_{t-1}|\mathbf{x}_t) & \stackrel{\mathrm{def}}{=}q(\mathbf{x}_{t-1}|\mathbf{x}_t,f_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_t)) \\
 & =\mathcal{N}\left(\sqrt{\alpha_{t-1}}f_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_{t})+\sqrt{1-\alpha_{t-1}-\sigma_{t}^{2}}\cdot\frac{\mathbf{x}_{t}-\sqrt{\alpha_{t}}f_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_{t})}{\sqrt{1-\alpha_{t}}},\quad\sigma_{t}^{2}\mathbf{I}\right) \\
 & =\mathcal{N}\left(\sqrt{\alpha_{t-1}}\cdot\frac1{\sqrt{\alpha_t}}\left(\mathbf{x}_t-\sqrt{1-\alpha_t}\boldsymbol{\epsilon}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_t)\right)+\right. \\
 & +\sqrt{1-\alpha_{t-1}-\sigma_t^2}\cdot\frac{\mathbf{x}_t-\sqrt{\alpha_t}\left(\frac{1}{\sqrt{\alpha_t}}\left(\mathbf{x}_t-\sqrt{1-\alpha_t}\boldsymbol{\epsilon}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_t)\right)\right)}{\sqrt{1-\alpha_t}},\quad\sigma_t^2\mathbf{I}\Bigg) \\
 & =\mathcal{N}\left(\sqrt{\alpha_{t-1}}\left(\frac{\mathbf{x}_t-\sqrt{1-\alpha_t}\boldsymbol{\epsilon}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_t)}{\sqrt{\alpha_t}}\right)+\sqrt{1-\alpha_{t-1}-\sigma_t^2}\cdot\boldsymbol{\epsilon}_{\boldsymbol{\theta}}^{(t)}(\mathbf{x}_t),\quad\sigma_t^2\mathbf{I}\right)
\end{aligned}$$

我们可现在来看DDPM和DDIM两者的区别
在最后我们的DDPM的改进后的建模就是$p(x_t|x_0)$这样一个Markov过程
而DDIM采用了non-Markovian的结构 这使得我们的扩散速度加快

**References:**
1.[arXiv:Tutorial on Diffusion Models for Imaging and Vision][[2403.18103] (https://arxiv.org/abs/2403.18103)
2.[张振虎的博客 ai-gc]([AI内容生成（ai-gc） — 张振虎的博客 张振虎 文档](https://www.zhangzhenhu.com/aigc/index.html))



