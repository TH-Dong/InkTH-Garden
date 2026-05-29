---
title: "04 Mamba2"
tags:
  - LLM Architecture
  - Mamba
summary: "Mamba架构的改进 mamba2"
draft: false
---

mamba留下了两个问题?
+ SSM architecture和Attention我们是否能够尝试去建立他们两者之间的关系?
+ Mamba 在 Inference上固然有他的优点,但是 Training 尽管做了一定的优化,但是已经没有Attention的高效 能够思考好的办法去优化呢?
## SSM Model
我们简单回顾Selective SSM的Model$$h_t=A_th_{t-1}+B_tx_t$$$$y_t=C^T_th_t$$他就是一个对$x\in \mathbb R^T$ 到 $y\in \mathbb R^T$ 的mapping, $x_t,y_t$ 是一个scalar,就是相当于当前的输入token和输出token $h_t$ 是hidden_states 用来存储过去所有的信息 我们用一个N dimension的vector来进行存储 
$A \in \mathbb{R}^{(T, N, N)}$ 负责state到state的转换 是一个N到N维度的转换 
但是由于**Selective SSM**  我们的参数是随时间变化的 动态生成当前时刻的参数 $A_t, B_t, C_t$ 这意味着对于序列中的每一个时间步 $t$（从 $0$ 到 $T-1$），都有一组独立的参数 
我们用了一个时间维度T来存储 但是我们每次进行计算时候只取当前的time step
$B \in \mathbb{R}^{(T, N)}$ input到state的转换 把当前的token融合进去hidden state
$C \in \mathbb{R}^{(T, N)}$ hidden_state 到 output的转换 因此乘以了一个transpose

## Modification of Mamba2
Mamba2 在 Mamba的基本上进行了几处修改
==第一处==就是我们的 **A matrices** ,原来是diagonal的 (一开始是HiPPO三角矩阵,但是在Mamba中我们采用了一种对角化的技术 我们把他变成的diagonal的 因此现在实际上我们的A矩阵只需要去存储这样的一个矩阵 $\mathbb R^{T\times N}$ 就可以去描述一个$N\times N$的矩阵了)
而Mamba2 中 我们用一个为了**提高效率,还有后面的duality表达** 我们把A改写成一个scalar乘以单位矩阵$$A_t = a_t \cdot I = \begin{bmatrix} a_t & 0 & \dots \\ 0 & a_t & \dots \\ \vdots & \vdots & \ddots \end{bmatrix}$$
==第二处== : Multi-head SSMs
我们类似Attention MHA 我们用了更多的heads 每个heads都独立的运行一套SSM P是我们的heads的dimension  把总维度 $D$ 切分成 $H$ 个头，每个头的大小是 $P = D/H$
因此我们的每个头运行这样的model$$Y^{(T,P)}=\text{SSM}(A^{(T,...)},B^{(T,N)},C^{(T,N)})(X^{(T,P)})$$最后再拼接起来得到最后的结果

区别一下Mamba1和Mamba2
SSM 公式 $h' = Ah + Bx$ 只能吃标量 $x \in \mathbb{R}$
**Mamba1** 相当于输入一个token (D dimension)
- 第 1 个通道有它自己的参数 $A^{(1)}$
- 第 2 个通道有它自己的参数 $A^{(2)}$
- ...
- 第 $D$ 个通道有它自己的参数 $A^{(D)}$
每个维度都有自己独立的动力学特征
Mamba1就相当于$P=1$
**Mamba2** 设总维度 $D=1024$，头维度 $P=64$，那么我们有 $H = 1024/64 = 16$ 个头
- 在 Head 1 内部（包含第 1 到第 64 个通道）：**所有的通道共用同一个标量 $A^{(head1)}$** 
- 在 Head 2 内部（包含第 65 到第 128 个通道）：共用另一个标量 $A^{(head2)}$
允许我们将这 $P$ 个通道打包，直接用 **Tensor Cores** 进行大规模矩阵乘法

这种参数共享是应该的 model在遇到“um..”的token时应该对所有通道生效 而不是只对一个通道生效 而有的通道却记住 
通过这种改动 **我们可以让Training更快(矩阵乘法更方便) 允许我们又更大的N** 所以虽然A表达被削弱了 但是我们可以通过增加N的来强化我们的hidden_states的表达能力 **但是代价就是维度越高的hidden 推理固然就更慢**
>Mamba-2 isn’t _strictly_ better than Mamba-1: while it’s a dramatic improvement from a _training_ perspective, Mamba-1 might be better from a pure _inference_ perspective.

## SSD & Attention
我们在后面会证明: SSM本质上也是Attention两点修改
+ 去掉了softmax $(QK^T)V$我们就可以先计算$K^TV$ 
	$K^T$ 是 $d \times N$，$V$ 是 $N \times d$ 它们相乘得到一个 **$d \times d$** 的矩阵 这个矩阵大小是**固定的** 跟序列长度 $N$ 没关系! 我们这个时候用Q的每个query去乘这个矩阵 就能得到最后长度为N的的output 复杂度直接降低到$O(N)$ 这本质上也是Linear attn的基本思想
+ SSD引入了一个掩码矩阵 $a_{i:j}^\times = a_i \cdots a_{j+1}$
	两个位置 $i$ 和 $j$ 之间的关联程度，取决于它们之间所有 $a$ 值的连乘 都接近0就不怎么关联 都接近1就关联 区别于transformer的位置编码 位置1和100就是距离远 而mamba可以根据当前的内容 自主判断这个token对我的重要性来定他的远近 即**位置是主观的**

在实际的工程中:
SSM推理$O(N)$的优点很明显 但是因为他是递归的 而这很难利用GPU的并行优势 而Attention虽然是qudratic的复杂度 但是他的矩阵乘法却很适合GPU的计算
因此在实际的工程中 我们用分块的办法
对于巨大的$T\times T$ 矩阵 我们把他分解成小块
+ 块内(Intra-chunk)我们采用attention模式 块小 qudratic可以接受 而且能利用上GPU效率
+ 块间(Inter-chunk)我们采用SSM递归模式
![SSD chunkwise computation](/images/knowledges/llm/3-Architecture/image-4.png)

| Attention               | SSM    | SSD    |        |
| ----------------------- | ------ | ------ | ------ |
| State size              | $T$    | $N$    | $N$    |
| Training FLOPs          | $T^2N$ | $TN^2$ | $TN^2$ |
| Inference FLOPs         | $TN$   | $N^2$  | $N^2$  |
| (Naive) memory          | $T^2$  | $TN^2$ | $TN$   |
| Matrix multiplications? | ✅      | ❌      | 对      |
memory的说明: 如果是原生递归 SSM需要存下来每一个time step的 $N \times N$ 状态后面求导 但是SSD过Chunkwise，它不需要存储每一时刻完整的 $N^2$ 状态，只需要存储块边界的状态或中间变量 在合理的实现下，它可以将显存需求降低到 $TN$ 量级 

Reference:
[1] [State Space Duality (Mamba-2) Part I - The Model | Tri Dao](https://tridao.me/blog/2024/mamba2-part1-model/)
