---
title: "model merging survey"
date: "2025-12-10"
tags:
  - model merging
summary: "很早之前针对model merging做的调研 但是觉得还蛮有意思的 可惜最后也没有坚持下去这个方向 纪念一下当作"
draft: false
---

个人观点(这部分如果有理解不太对的地方希望学长指出):
model merging的本质问题在于参数变化的conflict 而为了解决这个conflict
而大部分解决这个问题的都是在做一个 **权重解耦**的工作
 $f\left(x; \theta_0 + \sum_{t=1}^{T} \alpha_t \tau_t\right) = \sum_{t=1}^{T} f(x; \theta_0 + \alpha_t \tau_t)\mathbb{1}(x \in D_t) + f(x; \theta_0)\mathbb{1}\left(x \notin \bigcup_{t\in[T]} D_t\right).$
 这个公式的含义就是输入某一项任务的数据时.希望模型的参数只是经过该相应数据集微调后模型
 而权重解耦的工作很多 **一方面是怎么去解耦,另一方面是在做scaling factor** 也有很多从不同角度来进行探讨的
 
 在谈及Model Merging之前 想先讲一个model merging中常见的现象
## Permutation-type Model Merging
 (same task with different initializations and training parameters)
1.Linear Mode Connectivity, LMC barriers:在参数空间中A,B都是低loss的山谷,但是AB连线上任意一点(AB线性组合)很可能是高loss
2.Why?在一个神经网络的某一层中，**交换神经元的顺序，并相应地调整下一层的输入权重，网络的最终功能完全不变**
同一个位置的神经元学习的东西不一样--->Unaligned Weights
3.Solution:假设是在相同数据集训练的,找到最佳的permutation,然后再线性插值
4.Q:相同数据集下学的为什么还要merge? 
1)merge后的模型位于同一个平坦开阔的Loss Landscape,泛化性更强,能提升对特定噪声的鲁棒性
2)Ensemble的替代方案
5.如何Permutation
1)Weight Matching 重排后L2距离最小
2)Activation Matching 给模型输入同一批数据,观察神经元的的激活值模式
3)Combination Matching
2)最优传输或者学习的办法

后面有关这方面对齐的工作不少!

## LLM Model Merging
### 1.基于权重Permutation对齐(Pre-Merging)
**[Update Your Transformer to the Latest Release: Re-Basin of Task Vectors](https://arxiv.org/pdf/2505.22697) ICML2025**
Model Re-basin:将两个模型之一的参数进行变化 映射到另一个模型的局部低Loss basin中
Permutation Symmetries:即交换同一层内的神经元（单元）不会改变网络的整体功能
现有对齐方法的问题:头部污染(混合了来自原始模型不同头的神经元) 残差连接$z_i​=z_{attn}​+x$ (经历不同的置换，导致两个不兼容的表示被相加)
作者分别做了Inter-Head Alignment 决定A的哪几个头和B的哪几个头配对 防止混合了来自原始模型不同头的神经元 采用奇异值分解后的距离 然后构建成本矩阵 LAP问题
Intra-Head Alignment 对齐单个的神经元 基于权重的**内积** 
得到最后的置换矩阵 对残差连接做了一个补偿的置换组合

### 2.另辟蹊径:新的微调办法让模型更好合并(Pre-Merging)
**Fine-Tuning Attention Modules Only: Enhancing Weight Disentanglement in Task Arithmetic. [ICLR 2025](https://dblp.org/db/conf/iclr/iclr2025.html#JinHXS025)**
理论基础:作者任务在模型的切线空间微调可以改善模型解耦 理论来源于NTK 强制模型在线性化状态下微调（称为NTK线性化）但是计算高昂
作者发现**Attention Modules** 本身就表现出很强的“核行为” 
只微调注意力模块 做实验(1) 微调整个ViT模型；(2) 只微调注意力模块 有力地证明了**注意力模块展现出很强的核行为**

**MITIGATING PARAMETER INTERFERENCE IN MODEL MERGING VIA SHARPNESS-AWARE FINE-TUNING ICLR2025**
设计一种全新的微调目标函数 减少参数的干扰 又能够保证单任务性能(就是骂线性微调任务性能不行)
作者发现这个目标和Sharpness-Aware Minimization - SAM 很相近 **不是仅仅找到损失函数的最低点（最小值），而是找到一个宽阔、平坦的区域（flat minima）优化模型的泛化能力** 
目标函数: $\min _{\theta}\left[\max _{\|\epsilon\|_{2} \leq \rho} \mathcal{L}(\theta+\epsilon ; \mathcal{D})-\mathcal{L}(\theta ; \mathcal{D})\right]+\mathcal{L}(\theta ; \mathcal{D})$
简化:$\min _{\theta} \mathcal{L}(\theta+\hat{\epsilon} ; \mathcal{D}) \quad \text { 其中 } \quad \hat{\epsilon} \triangleq \rho \frac{\nabla_{\theta} \mathcal{L}(\theta ; \mathcal{D})}{\left\|\nabla_{\theta} \mathcal{L}(\theta ; \mathcal{D})\right\|_{2}}$
ASAM 自适应SAM 根据每个参数调整扰动的大小 文章采用的就是ASAM
一系列数学推导就略了 最终就是得到了这样一个特定任务目标优化函数 $\theta_{t}=\underset{\theta}{\arg \min } \mathcal{L}\left(\theta+\sum_{s \neq t} \alpha_{s} \tau_{s}+\left(\alpha_{t}-1\right) \tau_{t} ; \mathcal{D}^{(t)}\right)$

从任务 t 的角度看，模型合并过程对其参数施加的一种**扰动 (perturbation)**
但是有一个问题? 我们没办法得到其他任务的task vecotr 所以做了一个把扰动看作一个近似逼近(扰动项依赖于当前正在优化的任务向量)

$\min _{\theta} \mathcal{L}(\theta+\hat{\boldsymbol{\epsilon}} ; \mathcal{D}) \quad \text { where } \quad \hat{\boldsymbol{\epsilon}}=\rho \frac{\nabla_{\theta}^{2} \mathcal{L}(\theta ; \mathcal{D})}{\left\|\nabla_{\theta} \mathcal{L}(\theta ; \mathcal{D})\right\|}$



### 3.稀疏化(基于重要性)(During Merging)

![[image1.png|703]]
 这是最常见的 也是23-24年工作的重点(可以参考上图的Pruning部分)
稀疏化最常见的是软剪枝(将参数乘以一个(1-伯努利分布),利用随机变量分配剪枝概率) DARE,DAREx,DELLA都是
也有硬剪枝 直接基于排序干掉权重 TIES,Model Breadcrumbs都是
==也有基于激活值来进行剪枝的 这里我还没有进行调研,(感觉不是很出名?)==

**Magnitude-based Pruning Merging** : 
**1)Random Drop** : 
①DARE:对于task vector,随机丢弃drop率是p,并乘以以一个scaling factor
$m^{t} \sim \text{Bernoulli}(p),$
$\tilde{\delta}^{t} = (1 - m^{t}) \odot \delta^{t},$
$\hat{\delta}^{t} = \tilde{\delta}^{t} / (1 - p).$
其中除以一个系数(1-p);通过计算得到的:剪枝后的hidden_states期望值和没有剪枝的期望值相同
②DAREx:(DARE在高pruning rate下效果下滑严重,调整缩放因子为$\frac 1 q$ 
这个q可以通过有标签的验证集来确定,也可以用无标签的办法确定
**2)Weighted random drop**:
DELLA:
![[image2.png|600]]
Step1:Drop MagPrune 考虑magnitude 把一层所有的delta参数进行rank rank越高(排名小)丢弃的概率就越小 然后和DARE
一样分配概率drop乘以缩放因子$\frac 1 {1-p_i}$ 
Step2:Elect 同一位置的合并参数有正有负,存在冲突 在同一位置所有参数加起来的符号取为主导方向)为正就只取正,反之取负
Step3:Fuse:全部加起来得到平均值 然后$\theta_m=\theta +\lambda \cdot \delta^{avg}$
**3)Weight sorting** 硬剪枝
①TIES:
![[image3.png|600]]
Step1:Trim (个人认为DELLA可以看作软剪枝,每个参数都通过概率来剪)而TIES直接保留topk%的参数,其他设置成0
Step2:Elect 同样的算符号$\gamma_m=sgn(\sum_{t=1}^n \hat \tau_t)$ 
Step3:Disjoint Merge 只取符号和当前位置主导符号的参数 然后相加取平均
$\mathcal{A}^{p} = \{t \in [n] \mid \hat{\gamma}_{t}^{p} = \gamma_{m}^{p}\}$ 
$\tau_{m}^{p} = \frac{1}{|\mathcal{A}^{p}|} \sum_{t \in \mathcal{A}^{p}} \hat{\tau}_{t}^{p}$
$\theta_m \leftarrow \theta_{init}+\lambda* \tau_m$ 

②Model Breadcrumbs
![[image4.png|600]]
在模型合并前 过滤掉可能的Negligible Perturbations(训练中随机噪声造成),Large Outliers(极大的权重变化,可能代表过拟合)==这个很有意思,之前的文章拿大的delta保持不要扔,而这篇文章认为大的delta是过拟合的结果==
思路也及其简单 把前面后面都mask了 逐层获得掩
码 然后这些掩码stack在一起 用来单独一个model的掩码 然后用这些掩码乘以相应delta再乘以一个缩放系数就可以了
![[image5.png|600]]

==剩下的一些方法比较混乱?? 但本质都是在做参数解耦==

### 4.动态路由(这方面工作不少)(During Merging)
**Twin-Merging: Dynamic Integration of Modular Expertise in Model Merging NIPS 2024 poster**
文章认为知识分成Shared Knowledge和Exclusive Knowledge 共享知识是预训练做的 很重要 (实际上就是想讲遗忘这个问题) 而独占知识作者做了实验:稀疏率高达99%时，合并这一个模型的效果，仍然比合并8个未经稀疏化的模型要好  **一小部分独占知识是高效且关键的，但大部分是冗余的** 直接将所有独占知识进行合并，会引入大量干扰

所以思路其实很清晰了 就是先要有一个共享的专家 然后得到Exclusive Konwledge 然后把这个知识压缩稀疏化一下 然后路由化
共享的专家: 直接简单合并 (文中用了最简单的合并) $\theta_{s} \leftarrow \theta_{0}+\sum_{t=1}^{T} \gamma_{t}\left(\theta_{t}-\theta_{0}\right)$
然后得到压缩知识后 SVD提取前r个奇异值 $v_{t} \leftarrow S V D_{r}\left(\theta_{t}-\theta_{s}\right)$

**然后就是引入可训练的Router:** 先放入共享专家$\theta_s$ forward的最后一层token embbedding作为路由器输入
然后得到softmax后的权重 $\theta^{*}=\theta_{s}+\sum_{t=1}^{T} w_{t} \cdot v_{t}$

**CAMEx: Curvature-aware Merging of Experts ICLR2025**
模型合并约等于梯度下降 观察两者式子形式
$\theta_{n+1} = \theta_n - \eta \nabla \mathcal{L}(\theta_n)$
$\hat{\theta}^m = \theta^m + \alpha \sum_i (\theta^i - \theta^m)$ 
$(\theta^i - \theta^m)$ 可以看作“类梯度”（gradient-like）的更新方向
但是作者认为深度学习的参数空间不是平坦的(引了一篇1998的论文) 有Riemannian characteristics 应该用自然梯度更新 通过乘以一个称为“黎曼度量张量”（通常是fisher信息矩阵的逆）的矩阵来对常规梯度进行修正，从而考虑到空间的曲率 但是fisher计算cost高 所以引入了一个可学习的曲率矩阵
$\theta_{n+1} = \theta_n + \eta G(\theta_n) (-\nabla \mathcal{L}(\theta_n))$ 
$\hat{E}_m^l = E_m^l + \alpha \sum_{i=1}^{N-1} M_i \cdot (s_i^l * \tau_i^l)$ 
**这个作者推导后证明这个更新得到一个新的修正信号 引入了一个动态的稳定器和加速器**
然后是dynamic merging的设计
![[image6.png|500]]
左图根据Rouetr的得分激活top k个专家 然后output加权
中图经过router的加权merging
右图 Dynamic Merging SMoE Layer 本质上是一个递归过程 在LLM的每个attention层中的FFN替换成这个
在第l层 街上l-1层的全局expert $E_m^l$ 根据曲率感知合并 将这个和剩下N-1个本地专家融合
然后为下一层准备新的全局专家 $E_m^{l+1} = E_m^l + \frac{\alpha}{N-1} \sum_{i=1}^{N-1} M_i \cdot \tau_i^l$ 

### 5.寻找Subspace (实际上稀疏化也是在找Sparse subspace)
#### 正交化投影(During Merging)
Merging Models on the Fly Without Retraining: A Sequential Approach to Scalable Continual Model Merging(WHU Bo Du)
**逐步合并** 文章的核心观点**新任务参数的更新方向（即“任务向量”）应该与已合并模型的参数更新方向近似正交**
所以文章用了一个投影矩阵(投在合并模型参数的正交子空间 来乘以task vector)
![[image7.png|500]]
同时涉及了一个scaling factor参数爆炸 模型飘逸到loss basin之外

### 5.掩码合并 $(1-M)\odot \tau_{seq}^{(j-1)}+M\odot \tau_j$ 直接避免冲突(During Merging)
CALM: Consensus-Aware Localized Merging for Multi-Task Learning ICML 2025
首先 这篇文章属于半逐步合并 它先合并大部分任务模型(这些模型直接简单合并) 然后序列合并其他模型(这些模型更加精细后并,就是提出的办法)
==remark:我觉得这个是有道理的 先加进去的模型参数会占主导地位 而后面的参数加进去就会效果不那么好 所以做的是精细的优化办法==
Why Do More Experts Fail? A Theoretical Analysis of Model Merging?
Theory文章指出:==优先选择相关性低的专家逐步merge(本质还是不要冲突) 最初的模型会占据参数空间最重要部分(GUassian width)==,(采用了把参数变成重尾分布?但是感觉他的实验很toy没仔细看效果)
作者一开始先生成高质量的伪标签(香农熵判断可信程度,可信程度高质量高) 然后利用这个伪标签来训练掩码函数 L1正则化就是希望有更多的0
$\min_M\sum_{t_v\in S_v}\mathcal{L}_{t_v}(\theta_{seq}^{(j)})+\alpha||M||_1$ 

### 6.梯度下降更新Task Vector
**Whoever Started the Interference Should End It: Guiding Data-Free Model Merging via Task Vectors ICML2025**
直接设计Loss Function来优化Task Vector
我们没有Dataset 只有Taskvector 但是
**作者认为任务向量更成了对应input的一个线性子空间 所以作者认为我们可以通过task vector重构input**
作者在理解task vector中引入了几个引理
在微调过程中，单个数据样本在不同训练步骤中被送入同一个线性层时的输入（即前一层网络的输出）是高度相似或“一致”的
任务向量（即其权重的总变化量）等于每次迭代中梯度更新的累加 。而每次的梯度更新，都可以被分解为与当时**输入向量**相关的乘积
任务向量就可以被非常精确地近似为**一个由其对应输入向量构成的线性组合**
**任务向量构成了输入的近似线性子空间**
作者定义了线性层l在任务i上收到的干扰 合并模型和专家模型在该层输出上差异的期望值
$\mathcal{J}_i(\tau_{m,l}) = \mathbb{E}_{\mathbf{x}_{i,l}\sim p(\mathbf{x}_{i,l})} || \theta_{m,l}\mathbf{x}_{i,l} - \theta_{i,l}\mathbf{x}_{i,l} ||_2^2$ 
然后证明了这个干扰有一个上线 所以就想要去优化他的上限 最后设计出损失函数(其实这个数学推导我也没太明白 有点晦涩)
$\mathcal{L}_l = \sum_i \frac{1}{||\tau_{i,l}||_F^2} ||(\tau_{m,l} - \tau_{i,l})(\tau_{i,l})^T||_F^2$
**WUDI-Merging**
以下解读**From Gemini**(讲的很清楚 我觉得都可以直接看Loss function解读 他的推导太晦涩了)
- **$(τ_{m,l} - τ_{i,l})$**:  这就是我们前面定义的干扰向量 $δ_{i,l}$ 。对于任务i 来说，这就是合并向量中那些“外来的”、“不属于我”的部分。
- $(τ_{i,l})ᵀ:$  这是原始任务 `i` 的任务向量的转置。在数学上，一个向量和它的转置相乘，可以用来定义一个**投影矩阵**，它代表了由这个向量所张成的**线性子空间**。您可以把它理解为任务 `i` 自己的“地盘”或者“规则体系”。
- $(τ_{m,l} - τ_{i,l})(τ_{i,l})ᵀ$:  这一整块是核心。它在做的操作是**投影 (Projection)**。它计算的是：**“干扰向量$δ_{i,l}$” 在 “任务`i`的‘地盘’ $(τ_{i,l})ᵀ$” 上的投影**。这个投影向量的“大小”（范数），就代表了“外来干扰”对任务`i`本身造成了多大的“破坏”或“扭曲”。
- $||...||_F^2$:  这是弗罗贝尼乌斯范数的平方，简单理解就是计算那个“破坏/扭曲”的**程度有多大**。
- $∑ᵢ ...$:  把所有任务（i=1, 2, 3...）各自被“破坏”的程度全部加起来，得到一个**总的冲突值**。
- $1 / ||τ_{i,l}||_F^2$:  这是一个**权重**。对于那些本身“改动”就很大的任务（任务向量 `τ_{i,l}` 的范数大），我们稍微放宽一点，允许它承受多一点的冲突。反之，对“改动”很小的任务，我们对冲突的存在更敏感。

这篇文章到底再做什么 Algorithm流程是什么
准备阶段:
* **输入**：$\theta, \theta_1, \theta_2, ...$
* **计算**：$\tau_1 = \theta_1 - \theta, \tau_2 = \theta_2 - \theta, ...$
* 此时，$\theta$ 和 $\theta_i$ 的使命已经完成，进入“只读”状态。$\tau_i$ 也被固定下来，作为后续计算的“参照物”，本身不会被修改。
优化阶段 (逐层进行):
1.  选择第一层线性层。
2.  **初始化**: $\tau_{m, \text{layer1}}$ (第一层的合并任务向量) = $\sum_{i} \tau_{i, \text{layer1}}$。
3.  **进入循环**: 在循环的每一步中，算法根据损失函数 $L(\tau_{m, \text{layer1}}, \tau_{1, \text{layer1}}, \tau_{2, \text{layer1}}, ...)$ 计算梯度。
4.  **修改**: 梯度更新步骤 $\tau_{m, \text{layer1}} \leftarrow \tau_{m, \text{layer1}} - \zeta \cdot \nabla_{\tau_{m, \text{layer1}}}L$。
5.  **注意**：在这个更新公式里，只有 $\tau_{m, \text{layer1}}$ 是变量，被反复修改。而所有的 $\tau_{i, \text{layer1}}$ 都是固定的常数，仅用于计算损失和梯度。
完成:
* 第一层线性层的 $\tau_{m, \text{layer1}}$ 优化完毕后，算法会对第二层、第三层...所有线性层重复上述过程。
* 最后，将所有优化好的 $\tau_{m, \text{layer1}}, \tau_{m, \text{layer2}}, ...$ 组合起来，形成最终的、完整的 $\tau_m$。
* 最终的模型：$theta_m = \theta + \tau_m$
## 有关Lora的Model Merging(基本是基于LORA特性做Pre-Merging)
**Model merging with SVD to tie the Knots ICLR 2024**
==这篇文章对齐的思想感觉很不同 不再是参数解耦 他更像是让每个专家有一套统一的框架来表达自己的知识 避免混乱== 
把原矩阵concat在一起然后做奇异值分解 U就是他们的空间基 V就是与任务相关的但是被统一了更新信息
把V给merge了然后再乘以UΣ 得到更新的task vector 
**关键信息存在于低维子空间**

 **Unraveling LoRA Interference: Orthogonal Subspaces for Robust Model Merging ACL 2025** 
 核心思想很简单 有两个lora模块$\{B_1,A_1\},\{B_2,A_2\}$ 合并后的输出是这样的
$W_{merge}h_1=(W_0+B_1A_1)h_1+B_2A_2h_1$ 而我们对于由1微调出来的结果只想要$B_1A_1+W_0$ 的结果 对于$B_2A_2h_1$ 我们想让他接近0
所以多个数据组成$H^T$ 所以最后$AH_1^T$ 尽量小 加了一个约束A是orthonormal的 然后这个有解析解 直接出
然后合并的时候也可以接替他的合并办法 它相当于只是做一个初始化

**Merging LoRAs like Playing LEGO: Pushing the Modularity of LoRA to Extremes Through Rank-Wise Clustering ICLR 2025 Poster** 
作者把LORA的A,B矩阵不再视作一个整体 而是看作多个r个rank1矩阵的和 每个秩一矩阵看作一个最小的语义单元 MSU
这篇文章又考虑的参数没有对齐的问题 而他看的是我们的最小语义单元MSU没有对齐(作者做了一个实验，将一个LoRA与它自己随机打乱MSU顺序后的版本进行合并。结果显示，即使是和自己合并，仅仅因为未对齐就会导致性能显著下降)
所以作者首先做对齐 所有Lora模块做秩一分解 然后Clustering 然后合并喝的k个cluster里面的center成为新的LoRA模块
然后考虑了scaling factor 理论上证明了一个缩放因子来保持方差不要过度膨胀

## MLLM merging
**UQ-Merge: Uncertainty Guided Multimodal Large Language Model Merging ACL2025**
文章实验指出:合并后的模型性能由于任何单个模型(?) 但是有选择性地合并一部分模型性能能进一步提升
作者认为有的模型是有害的
作者采用不确定性量化Uncertainty Quantification, UQ来指导合并
好的模型在面对模糊输入时 应该表现出高得不确定性 过度自信的坏模型 低不确定性 所以我们用图文扰动来判断模型好坏 
通过输出的不确定性减去数据不确定性得到模型不确定性
$\mathcal{UQ}\left(M, x_{o}, x_{t}\right) \approx \mathcal{H}\left(\frac{1}{J} \sum_{j=1}^{J} M_{\epsilon}^{j}\left(\mathcal{P}_{v}^{j}\left(x_{o}\right), \mathcal{P}_{t}^{j}\left(x_{t}\right)\right)\right)-\frac{1}{J} \sum_{j=1}^{J} \mathcal{H}\left(M_{\epsilon}^{j}\left(\mathcal{P}_{v}^{j}\left(x_{o}\right), \mathcal{P}_{t}^{j}\left(x_{t}\right)\right)\right)$
然后基于不确定性排序 先合并不确定性高的模型 但并不合并完 每一次合并后我们要计算这个新模型的UQ分数 我们希望这个UQ分数更小(就是希望最后的合并模型要自信)

**AdaMMS: Model Merging for Heterogeneous Multimodal Large Language Models with Unsupervised Coefficient Optimization CVPR2025**
解决异构模型的merging mapping + Merging + searching
mapping:只处理有同样的LLM预训练来的 但是有不同的modification on model structure M1和M2 把M2映射到M1的结构
对于共享参数(例如预训练模型) 直接**map**过来
对于M1额外的参数 但是他是某个参数的复制品  将它与M2中那个原始的、未被复制的参数对应起来(假设模型M2有一个处理**图像**的模块。模型M1为了同时处理**图像和视频**，它直接复制了这个图像模块)
对于M1独有的参数 标记为空 不参与合并
**Merging**过程文章很简单 直接线性插值merge
$\theta_{out}^i =\begin{cases}\theta_1^i, & \text{if } f(\theta_1^i) = \phi \\(1-\alpha)\theta_1^i + \alpha f(\theta_2^i), & \text{otherwise}\end{cases}$ 
**Search** 找到理想的超参数alpha 以前是拿验证集搜
模型在某个任务上的性能表现，与其生成内容的一致性（Generation Consistency）高度相关
让模型在一小部分unlabeled的数据集上生成response 然后看相邻点的内容差异DiffCnt函数 找到总差异值最少的alpha 
$D_i = \mathrm{DiffCnt}(G_i, G_{i-1}) + \mathrm{DiffCnt}(G_i, G_{i+1})$
方法其实没什么创新?就是缝?CVPR的论文应该比较看实验 这篇文章的效果确实好

**Unifying Multimodal Large Language Model Capabilities and Modalities via Model Merging** Arxiv2025
文章先是提出来一个Benchmark 视觉问答(VQA)、几何(Geometry)、图表(Chart)、光学字符识别(OCR)和指代定位(Grounding)等多种任务
Merging Method:文章基于WUDI [[#6.梯度下降更新Task Vector]]  

对于fft: 全量微调会调整模型的所有参数，导致任务向量维度极高，其中包含了大量的**冗余和噪声**,有害
先计算平均task vector $\bar \tau_l = \frac 1 n \sum_{i=1}^n \tau_{i,l}$  这个相当于task vector的center 分离出每个任务的“共性”(averge)与“个性(i-average”
然后我们只考虑任务的独特部分 即每个task vector相较于merge后的独有的知识 然后做SVD 和low rank approx
$\text{SVD}(\tau_{i,l} - \bar{\tau}_l) = U\Sigma V^T, \text{ where } U \in \mathbb{R}^{m \times r}, \Sigma \in \mathbb{R}^{r \times r}, V \in \mathbb{R}^{n \times r}. \quad$ 然后只取前面几个奇异值大的ΣV(最重要的、与任务最相关的知识被编码在前k个奇异分量中，而那些被丢弃的、能量较小的分量则被视作噪声和冗余信息,类似PCA)
然后作者更新了WUDI的loss 
原来:$\mathcal{L}_l = \sum_i \frac{1}{||\tau_{i,l}||_F^2} ||(\tau_{m,l} - \tau_{i,l})(\tau_{i,l})^T||_F^2$
现在:$\min_{\tau_{m,l}} \mathcal{L}_l = \sum_{i=1}^n \frac{1}{||\tau_{i,l}||_F^2} ||(\tau_{m,l} - U_{1:k}\Sigma_{1:k}V_{1:k}^T - \bar{\tau}_l)(\Sigma_{1:k}V_{1:k}^T)||_F^2. \quad$
就是把专业知识$\hat{\tau}_{i,l}$加上了自己最相关的特点

对于LoRA:lora只调整少量的low rank 矩阵 优化的时候为例满足于多个不同方向的任务向量约束$\tau_{m,l}$ 的norm会不断增长(实验证明)
作者多角度解决(这一段from gemini解读):
- **使用SGD优化器**：他们将优化器从Adam换成了SGD 。SGD在处理稀疏梯度时更加稳定，并且在某些情况下更能摆脱局部最优，有助于在LoRA这种受限的参数空间中进行更稳定的优化 。
- **采用不同的低秩近似策略**：对LoRA的任务向量，作者同样使用低秩近似，但关键区别在于**不进行第一步的中心化操作** 。这样做有助于直接降低任务向量本身的范数，从源头上缓解范数增长的压力 。
- **使用均值进行初始化**：在开始优化之前，将合并向量 $τ_m​$ **初始化为所有任务向量的平均值** 。这为优化提供了一个非常合理的起点，避免了从一个随机点开始导致范数失控增长的问题

文章一些展望 或许是以后一些方向?Future work will explore multilingual or reasoning-focused MLLM merging, incorporating visual chain-ofthought datasets to support expert reasoning models

**REMEDY: Recipe Merging Dynamics in Large Vision-Language Models    ICLR 2025**
==这篇文章是我唯一(应该?)看到的有关针对MLLM架构来真正设计merging的一篇文章==
将模型中可复用模块定义为 Recipes(如 projector 与 LLM 的浅层)
实验发现这些模块
- 显著提升了视觉感知能力
- 改进了图文交互理解
- 并非只是“模仿输出风格”，而是真正增强了任务迁移能力
提出**modality-aware allocator**
利用少量示例叛徒input(text+image)和recipe的关系 然后执行一次性权重分配
![[image8.png|650]]
然后就是Modality-aware Allocator具体咋设计的
token Understanding Component(用子注意力对输入每个token 计算出对模态更加铭感的$h_t$)
TOKEN-CONDITIONAL WEIGHT GENERATOR 就是一个分配权重函数 没啥说的 图上面好像是拿两层MLP表示的
然后就去训你的这个部件 然后就完了

**Parameter Efficient Merging for Multimodal Large Language Models with Complementary Parameter Adaptation** 浙大7月份一篇工作
文章术语饶了一下 一个叫base 一个叫graft 本质上就是微调后的两个模型 motivation也是废话

Local Weight Adjustment:如果两个模型在某个参数通道（channel/neuron）上的权重差异很大，这说明它们在该通道上学习到了不同的、有价值的信息 。我们应该利用这个差异信号来决定如何融合
计算每个通道i的绝对差之和 然后过一个gate 然后sigmoid学习每个通道的权重分配
$d_i = \sum_{j=1}^N |W_b[i,j] - W_g[i,j]|$
$w_{local} = \sigma(\phi(\mathbf{d}))$ 
Global Weight Adjustment:将模型权重参数离散化到n个区间 计算各自的熵 然后过一个反正切 在全局层面上，应该更偏向基础模型还是嫁接模型
$H(W) = - \sum_{k=1}^n p_k \log p_k$
$w_{global} = \frac{a}{c} \arctan(c[H(W_b) - H(W_g)]) + \frac{1}{2}$ 
Dual-Gate Fusion Strategy:通过非线性函数 $w_{local}$ $w_{global}$ 结合得到两个模型的中间融合权重 然后归一化 加权融合
$W_{fused} = w_b \odot W_b + w_g \odot W_g$ 
还设计了一个函数看这俩模型适不适合融合 
