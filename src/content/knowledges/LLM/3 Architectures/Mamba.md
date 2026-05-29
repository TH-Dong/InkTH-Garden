---
title: "03 Mamba架构"
tags:
  - LLM Architecture
  - Mamba
summary: "SSM架构 Mamba"
draft: false
---

一系列的架构的核心目的: 解决Transformers所带来的$O(N^2)$的注意力制 在Long Sequence上面所带来的**计算和内存**消耗

因此学术界尝试提出许多**subquadratic-time** 架构
其中一种便是 SSM State-Space model 状态空间模型
将计算复杂度降低到$O(N)$

## SSM的起源
在经典的Control相关的问题中,我们有:
Continuous-Time的物理系统
+ 状态矩阵: 我们以小车的运动状态为例子,描述$h(t)$随时间的演变(导数)$$h'(t) = \boldsymbol{A}h(t) + \boldsymbol{B}x(t)$$其中$x(t)$就是我们输入的信号(小车的推力),  $h(t)$是我们的latent state(小车当前的位置和速度,一个N维的vector),  $A$是Evolution matrix,最重要的参数,决定了系统在没有input的时候是如何演变的(例如说摩擦力让小车减速),B是我们的输入矩阵(N\*1的结构) 他决定的是我们的输入input是如何的影响我们的State
+ 输出方程: 决定我们所观测到的物理量$y(t)$ $$y(t) = \boldsymbol{C}h(t)+\boldsymbol Dh(t)$$C是我们的输出矩阵 从hidden-state去提取我们的所需要的信息
本质上就是在做 **动态的压缩我们的所有历史**
（此处原笔记使用了本地 Obsidian 图片 `Pasted image 20260114214404.png`，当前仓库中没有这张图，因此先移除失效引用）
最重要的参数:矩阵A 
矩阵A存储着所有的历史信息的浓缩精华,A描述了内部状态如何去连接 才能够更好的更新状态State

SSM有一个极其优美的性质:
循环和卷积的等价表示:
+ **From Recurrent View:** 类似于RNN
	$h(t)$ 依赖于上一个时刻的state 这和RNN的性质相似
	所以他天然有 推理高效的优点,只需要存储上一个State $h(t)$,input一个x就可以算出y 时间复杂度$O(1)$
+ **From Convolution View:** 我们可以尝试去求解这个微分方程组
	我们可以得到$$y(t) = \int_{0}^{t} \mathbf{C}e^{\mathbf{A}(t-\tau)}\mathbf{B} x(\tau) d\tau$$我们发现这是一个Convolution! $x(\tau)$ 和 $f(t-\tau)$
	因此它可以写成$$y(t) = (K * x)(t)$$ 其中$K(t)=\boldsymbol C e^{\boldsymbol At}\boldsymbol{B}$ 我们称其为SSM Kernel
	通过这个性质,我们就可以更加高效的训练模型
	因为训练的时候 我们知道整个序列x 我们去计算出整个kernel 然后做FFT做一次卷积 就可以算算出所有的y 而且可以并行化

因此:**SSM 结合了 RNN 的推理优势（恒定内存）和 CNN 的训练优势（并行计算）**
这也是为什么SSM看起来在deep learning能够Powerful的主要原因

但是为什么SSM以前没有成功呢? 有两个主要的问题
1:计算 $e^{\mathbf{A}t}$（矩阵指数）是非常昂贵的
2:随着时间的t的增加 $\boldsymbol A^t$ 要么趋向于0 要么趋向于正无穷(Taloy展开看和1的大小比较) 模型到长序列效果自然会变差

## 从SSM到S4 (Structured State Space)
### Discretization
依旧是老问题,计算机只能处理离散的数据 token
SSM是我们控制论的工具 而我们现在要处理-> 序列建模
所以我们现在就是把ODE变成Recurrence的过程

连续方程转化成离散方程有下面的常见几种方法:
(数值分析和数字信号处理的内容)
不同方法的本质在于:考虑$h(t+\Delta) = h(t) + \int_{t}^{t+\Delta} h'(\tau) d\tau$ 
在 $t\sim t+\Delta$ 这段时间内 我们的输入$x(\tau)$ 到底长什么样子 中间发生了什么 我们只能够假设,不同的假设就导致了不同的办法
+ Euler Method:
	假设变化率 $h'(t)$ 在这一小段时间内完全不变，等于起点的斜率
	因此我们根据导数的定义 $$h'(t) \approx \frac{h(t+\Delta) - h(t)}{\Delta}$$我们最终带入到微分方程 整理得到$$h_k = (1 + \Delta A) h_{k-1} + (\Delta B) x_k$$
+ Bilinear / Tustin Method:
	这一段时间内的斜率，约等于“起点斜率”和“终点斜率”的平均值（梯形近似）$$\frac{h_k - h_{k-1}}{\Delta} \approx \frac{h'(t_{k}) + h'(t_{k-1})}{2}$$通过代数运算 我们得到$\overline{A} = (I - \Delta A / 2)^{-1} (I + \Delta A / 2)$ $\overline{B} = (I - \Delta A / 2)^{-1} \Delta B$
+ Zero-Order Hold, ZOH:
	输入信号 $x(t)$ 像阶梯状, 在 $t$ 到 $t+\Delta$ 之间，输入保持为 $x_k$ 不变，直到下一个时间步才跳变
	零阶是因为Taloy的第0项就是const 
	这和LM是哲学上契合的 token一个一个进来,他的semantic在这一步处理时间是持续存在的
	我们利用常数变易法求解在时间区间$[t,t+\Delta]$下,这个方程的解$$\frac{d}{dt}h(t) = \mathbf{A}h(t) + \mathbf{B}x(t)$$我们得到相应的解析解:$$h(t+\Delta) = e^{\Delta A} h(t) + \int_{t}^{t+\Delta} e^{A(t+\Delta - \tau)} B x(\tau) d\tau$$现在因为我们假设了ZOH,所以在$\tau \in [t, t+\Delta]$ 这个积分区间里，$x(\tau)$ 是个常数 $x_k$ 常数可以从积分号里**提出来**的$$h_k = e^{\Delta A} h_{k-1} + \left( \int_{t}^{t+\Delta} e^{A(t+\Delta - \tau)} d\tau \right) B x_k$$然后我们去计算中间那个积分 就得到$$h_k = \underbrace{e^{\Delta A}}_{\overline{A}} h_{k-1} + \underbrace{A^{-1}(e^{\Delta A} - I) B}_{\overline{B}} x_k$$这便是最后我们得到的离散参数
	- **$\overline{A} = \exp(\Delta A)$**
    - **$\overline{B} = (\Delta A)^{-1} (\exp(\Delta A) - I) \cdot \Delta B$**
现在我们的SSM就变成了我们熟悉的RNN的形式:
$$\begin{aligned} h_k &= \overline{\mathbf{A}} h_{k-1} + \overline{\mathbf{B}} x_k \\ y_k &= \mathbf{C} h_k \end{aligned}$$

### Recurrence和Convolution的统一结构
+ 推理: $$h_k = \overline{\mathbf{A}} h_{k-1} + \overline{\mathbf{B}} x_k$$长得跟RNN一模一样,只是说没有tanh激活函数,**高效推理**
+ 训练:
	我们可以把递推式进行展开
	- $y_0 = \mathbf{C}\overline{\mathbf{B}}x_0$
	- $y_1 = \mathbf{C}\overline{\mathbf{A}}\overline{\mathbf{B}}x_0 + \mathbf{C}\overline{\mathbf{B}}x_1$
	- $y_2 = \mathbf{C}\overline{\mathbf{A}}^2\overline{\mathbf{B}}x_0 + \mathbf{C}\overline{\mathbf{A}}\overline{\mathbf{B}}x_1 + \mathbf{C}\overline{\mathbf{B}}x_2$
	这显然可以写成这样的一个Convolution$$y = x * \overline{\mathbf{K}}$$其中SSM Kernel $\overline{\mathbf{K}}$ 为：$$\overline{\mathbf{K}} = (\mathbf{C}\overline{\mathbf{B}}, \mathbf{C}\overline{\mathbf{A}}\overline{\mathbf{B}}, \mathbf{C}\overline{\mathbf{A}}^2\overline{\mathbf{B}}, \dots, \mathbf{C}\overline{\mathbf{A}}^{L-1}\overline{\mathbf{B}})$$训练时 我们一次性算出kernel(FFT) 然后就可以计算整个seq的输出 **并行训练高效**
![SSM recurrence and convolution](/images/knowledges/llm/3-architectures/image.png)

**==Question:Why Not just learn A?==**
为什么不直接利用nn去学习一个$\overline{\mathbf{A}}$?
+ 哲学角度
	而拆分成 $A$ 和 $\Delta$ 就能够很好的去解耦把 **“事物发展的规律 (A)”** 和 **“我们观察的频率/专注度 ($\Delta$)”** 
	$A$ 是我们对记忆的更新 而$\Delta$ 代表我们在当前输入 去学习,停留的时间
	(虽然在S4中是固定的 但是在Mamba中是可以dynamic的)
	所以通过这种动态的分配,我们可以有效的区分学习好的内容和没太大用处的内容
+ 数学角度
	直接学习$\overline A$ , 在进行n次幂的时候 eigenvalue小于1 导致最终趋于0 eigenvalue大于1 导致最终爆炸 这是老生常态的问题
	如果我们把把连续矩阵 $A$ 初始化为**HiPPO 矩阵**（一种特殊的反对称矩阵，后面会讲） 数学上可以证明，只要 $A$ 是这种特殊矩阵，那么不管 $\Delta$ 取多少（只要是正数），算出来的 $\overline{\mathbf{A}} = \exp(\Delta A)$ **一定**是一个表现非常稳定的矩阵（特征值在单位圆附近）
+ Gating机制
	在Mamba中 他还扮演了一个Gating的机制

### HiPPO
问题:前面提到了梯度消失和爆炸的问题,记不了长距离的信息
HiPPO的思想:**如果要完美地记住过去所有的输入历史 $x(t)$，我们需要存下什么？**
我们用一个多项式去拟合这些庞大的数据点$f(t) = c_0 + c_1 t + c_2 t^2 + \dots$ 最后我们只需要去存储他的系数就可以了$[c_0, c_1, c_2, \dots]$
![HiPPO intuition](/images/knowledges/llm/3-architectures/image-1.png)
**Def:** High-order Polynomial Projection Operators
把历史输入 $x(t)$ 投影到一组**正交多项式**（通常是勒让德多项式 Legendre Polynomials）上 而那个隐藏状态 **$h(t)$**，存的正是这组多项式的**系数**
$\tau$ 代表历史的回忆轴, $x(\tau)$代表客观的历史输入,$g^{(t)}(\tau)$ 代表我们去模拟的记忆(近似曲线),$P_n(\tau)$代表我们函数的basis $$g^{(t)}(\tau) = \sum_{n=0}^{N-1} c_n(t) P_n(\tau)$$而我们的SSM中的hidden state 就是这组系数向量$$h(t) = \begin{bmatrix} c_0(t) \\ c_1(t) \\ \vdots \\ c_{N-1}(t) \end{bmatrix}$$

而现在随着时间的延长,我们的固定区间$\tau$ $[0,t]$ 逐渐的变长 
历史变长,坐标系相当于被拉伸了,但是我们的曲线形状要保持不变,所以我们的系数$c_n$就需要重新调整
那么现在的问题的就是,系数我们应该如何更新呢?
我们的系数$c_n(t)$ 本质上$x$和$P_n$去做inner product 类似于fourier的思想(这里简化了一些缩放因子和权重系数)$$c_n(t) \approx \int_{0}^{t} x(\tau) P_n(\tau) d\tau$$现在要求变化规律 我们就需要去对$c_n$求导 求导后根据微积分的性质,我们会得到两个部分,
第一部分是积分上限t带来的变化 对应的是$\mathbf{B} x(t)$ 代表最新的 $x(t)$ 对每个系数都有贡献
第二部分是$P_n(\tau)$ 在 HiPPO 里实际上是 $P_n(\frac{\tau}{t})$ 求导相当于在对$P_n$进行求导 但是多项式求导仍然是多项式 所以有 **当前系数 $c_n$ 的变化率，只跟它自己以及比它阶数低的系数 $c_0, \dots, c_{n-1}$ 有关!** 所以它对应的就是$\boldsymbol Ah(t)$ 代表当前的每一个系数 是 之前的每一个系数的线性组合
$$\frac{d}{dt} c_n(t) = \underbrace{\text{一堆低阶系数的线性组合}}_{\mathbf{A} \cdot h(t)} + \underbrace{\text{新数据的影响}}_{\mathbf{B} \cdot x(t)}$$这也揭示了A矩阵是下三角矩阵的本质: 导数只与低阶有关 同时里面的数字都是固定的 因为都来自于勒让德多项式的求导公式
通过相关的积分变换计算 我们可以的得到$$\mathbf{A}_{nk} = \begin{cases} -(2n+1)^{1/2}(2k+1)^{1/2} & \text{if } n > k \\ -(n+1) & \text{if } n = k \\ 0 & \text{if } n < k \end{cases}$$即$$\mathbf{A} = -\begin{pmatrix} 1 & 0 & 0 & 0 \\ \sqrt{3}\sqrt{1} & 2 & 0 & 0 \\ \sqrt{5}\sqrt{1} & \sqrt{5}\sqrt{3} & 3 & 0 \\ \vdots & \vdots & \vdots & \ddots \end{pmatrix}$$我们也可观察到 对角线元素是$-(n+1)$ $e^{At}$ 决定了记忆的衰减 
越小的n代表低频分量 宏观平均 衰减慢 越大的n代表高频细节 衰减快 
$\mathbf{B}$ 通常被算出来是一个全非零的向量 这意味着当前的输入 $x(t)$ 会同时冲击所有的频率分量（从宏观到微观）

### S4
**S4 introduces a structured formulation that allows for fast and scalable computation**
我们有HiPPO矩阵 但是我们去计算$\overline {\boldsymbol A}$ 的幂次仍然是高cost $O(N^3)$ 的复杂度
	而S4采用一个NPLR (Normal Plus Low-Rank)的技术 把HiPPO矩阵分解成两个部分$$\mathbf{A} = \mathbf{V} \mathbf{\Lambda} \mathbf{V}^* - \mathbf{P} \mathbf{Q}^\top$$
- $V\Lambda V^*$ 是正规部分，可以完美地酉对角化（Unitary Diagonalization），数值极其稳定
- $PQ^*$ 是低秩部分（Rank-1 或 Rank-2），可以通过 **Woodbury 矩阵恒等式** 来进行修正
通过Woodbury 矩阵恒等式 S4把 计算复杂度$O(N^2L)$ 降到了 **$O(N + L \log L)$**
这里简单梳理一下数学逻辑:
转成到频域里面
算 $\bar{A}^k$ 很难,我们这里采用SSM的生成函数,对他做Z变换,原本算$\bar{K}$,现在算生成函数$\hat{K}(z)$ $$\hat{K}(z) = \sum_{i=0}^{\infty} \bar{C}^* \bar{A}^i \bar{B} z^i = \bar{C}^* (I - \bar{A}z)^{-1} \bar{B}$$现在我们只需要去求解这个逆 但是逆是$N^3$的计算复杂度
我们考虑到由于由于 $\bar{A}$ 继承了 $A$ 的 NPLR 结构，这个待求逆的矩阵本质上也是 **“对角矩阵 + 低秩矩阵”** 的形式,我们利用这个恒等式$$(A + UV^*)^{-1} = A^{-1} - A^{-1}U(I + V^*A^{-1}U)^{-1}V^*A^{-1}$$我们只把求逆操作作用在这个好计算的对角矩阵上面,然后通过低秩项俩进行修正
我们核心的计算任务变成了计算形如 $x^* (\text{Diagonal}^{-1}) y$ 的项
对角矩阵的逆，本质上就是包含 $\frac{1}{\omega_i - \lambda_j}$ 这种项的矩阵 计算 $\hat{K}(z)$ 在复平面单位根上的值，最终归结为：$$\sum_{j} \frac{x_j y_j}{\omega_i - \lambda_j}$$
![Cauchy kernel structure](/images/knowledges/llm/3-architectures/image-2.png)
- HiPPO 很好但不稳定 → 想对角化但 $V$ 爆炸 → **发现 HiPPO 是 NPLR 结构**
- NPLR 幂运算依然慢 → **转为生成函数求逆**
- 一般矩阵求逆慢 → **利用 NPLR 结构使用 Woodbury 修正**
- 修正后的计算 → **归约为柯西核计算**（已知有线性复杂度解法）

### Summary
S4是我目前读过论文里数学味很足的paper,首先他的结构都是有解释性的,很严谨的数学论证和分析与结构相互适应.而且他确实在长序列模型上面起到了一定的不错效果,SSM在处理全局上下文方面具有 Transformer 难以比拟的**线性扩展优势**
但是在纯语言建模上,和Attention相比仍然略逊色,说明Attention在语言建模上仍旧独特优势
这也是引发后面的思考 **S4能否,又如何和Attention结合?**

## Mamba - A Selective SSM
S4有一个巨大的问题:Linear Time Invariance
之前的SSM模型无论读取任何内容 其中的参数矩阵A,B永远都是固定的 模型必须要对所有上下文一视同仁 但是在现实中 我们真正需要的是去看那些信息重要的,我需要去记住 哪些信息是nosie我可以忽略
这也就是Attention的灵魂
论文的作者提到 **sequence modeling is compressing context into a smaller state**
而Transformer有KV cache 他记住了所有的历史,不压缩,强但是inference慢
RNN用来有限的states 快但是弱
而Mamba通过 引入 **Selection Mechanism** 根据输入能够动态的调整params
让Model能够自主的去提取重要的信息写入hidden states
从而具备transformers的 内容推理和上下文能力
### Selection Mechanism
我们的递归最后应该是这个样子
$$h_t = \overline{A}_t h_{t-1} + \overline{B}_t x_t$$
$$y_t = C_t h_t$$
原本的参数$B,C,\Delta$  是固定的
现在我们让这几个参数变成 我们的输入$x_t$ 的相关函数 
$B_t$:当前时刻的输入信息 $x_t$ 有多少**能被写入**到隐藏状态 $h_t$
$$
B_t = \text{Linear}(x_t)
$$

$C_t$:当前时刻的隐藏状态 $h_t$ 有多少**能被读出**并转化为输出 $y_t$
$$
C_t = \text{Linear}(x_t)
$$

Parameter 是一个可以学习的 bias,决定了模型初始的“时间尺度”.  
有的通道可能天生适合捕捉短期特征（Bias大），有的适合长期特征（Bias小）  
Softplus ($y = \ln(1+e^x)$) 是 ReLU 的平滑版本，确保输出恒大于 0
$$
\Delta_t = \text{Softplus}(\text{Parameter} + \text{Linear}(x_t))
$$

通过我们的离散化公式 我们可以得到
$$
\overline{A}_t = \exp(\Delta_t A)
$$
$$
\overline{B}_t = (\Delta_t A)^{-1}(\exp(\Delta_t A) - I) \cdot \Delta_t B_t
$$
每个token都能够根据input进行动态的调制 ,在Mamba中$\Delta_t$即时间步长 代表我们选择了多少的信息
面对重要的信息 $\Delta_t$ 会变大($\bar{A} = \exp(\text{小} \times \text{负数}) \approx 1$)  聚焦输入,更新状态,而面对噪声信息 $\Delta_t$会变小($\bar{A} = \exp(\text{大} \times \text{负数}) \approx 0$) 忽略输入保持状态
### Hardware-aware Algorithm
S4因为可以用conv训练所以更高速
但是conv的前提必须是Linear Time Invariant 但是很明显现在我们的参数是随时间变化的 我们不能够再做卷积(展开推导就可以看到不能够得到幂次)
因此我们又回到递归计算,但是传统的递归计算又是sequential的 不能并行
而且我们再计算的过程中需要即存储hidden_states $(B, L, D, N)$ 这个巨大的中间状态存入显存也是一项挑战
因此提出了一种hardware-aware的算法
把输入序列 $x$ 和参数 $(\Delta, A, B, C)$ 从慢速的 **HBM** 加载到快速的 **SRAM** 中
立即执行**Discretization** ，计算出 $\overline{A}_t$ 和 $\overline{B}_t$
用了**Prefix Sum)算法**的变体——并行关联扫描 (Parallel Associative Scan) 通过类似树状结构的归约（Tree Reduction），可以在 $O(\log L)$ 的时间内完成计算 这一步仍然是在SRAM中运行 读写成本很低 计算得到 $h_t$ 后，立即在 SRAM 中将其与 $C_t$ 相乘
通过核融合，Mamba 避免了将大小为 $(B, L, D, N)$ 的巨大中间状态 $h$ 写入显存相比传统实现，**IO 访问量减少了 $O(N)$ 倍**

不存h,bp的时候怎么办?
- Forward：如上所述，只算不存，扔掉中间状态 $h$
- Backward：当需要计算梯度时，从 HBM 重新读取输入和参数，在 SRAM 中**重新执行一遍前向计算**，现场还原出 $h$，然后计算梯度 
==计算永远比读写更快==
### Mamba Architecture
![Mamba architecture](/images/knowledges/llm/3-architectures/image-3.png)
本质上也是在堆叠同一种Block
projection之后我们做一次conv 本质上是为了提取局部上下文的信息 然后加激活函数 提取nonlinear的feature 然后进入selective SSM的内部层

Reference:
[1] [Efficiently Modeling Long Sequences with Structured State Spaces](https://arxiv.org/abs/2111.00396)
[2] [Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752)
