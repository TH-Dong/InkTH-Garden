---
title: "10 支持向量机SVM"
tags:
  - Classification
  - SVM
summary: "SVM的思想,损失设计,优化求解,对偶思想"
draft: false
---

## 最大间隔思想
对于分类问题,找到一个能分开训练数据的Hyperplane事实是不足够的
训练误差为 0 的分类边界，往往不是唯一的 
两条都能把当前训练集分开的边界，对未来点的表现可能差很多
**分类器不只是要把training set给分开 还应该选择一个对未来的样本更稳定的边界**

事实上有一个关键直觉: **边界离训练的样本太近 就会让分类变得脆弱**
一个好的分类边界 不应该只是正确,而应该有某种**安全余量** 这就是我们后面提到的 **margin**
我们应该去寻找 **"在所有能分开的线里，哪条线离两边样本都尽可能远"**
![[image-21.png|461]]

margin 和 泛化 是紧密相连的
我们很容易理解: 如果一个点距离边界很远，那么它在一定范围内移动，类别判断不会变   
如果一个点距离边界很近，那么一点点移动就可能翻过去 
>margin第一层含义: 分类结果对输入扰动的稳定性

其次 如果我们要求必须在较大的margin下分开数据 那么可以选择的集合就会很少 其实是一种隐式正则化原则
>margin第二层含义: 约束实际上在缩小模型的有效自由度

## 函数间隔与几何间隔
如何去思考 定义距离边界的远近呢?
对于一个$(x_i,y_i)$ 我们可能会去思考 $y_i(w^Tx_i+b)$ 这个量 正负编码了对错 大小有编码了离边界的距离
但是问题是 如果我们把$(w,b)$乘以一个正常数$c$ 边界不变 但是这个量明显会扩大
所以我们不能把他当作真正意义的几何距离

1.函数间隔 代数工具量

1)对一个样本 $(x_i,y_i)$，定义它相对于超平面 (w,b)的**函数间隔**为：$$
\hat\gamma_i = y_i(w^\top x_i+b)
$$hat代表函数距离 而不是几何距离 
我们知道，当 $\hat\gamma_i>0$ 时，样本被正确分类。 
而且 $\hat\gamma_i$ 越大，说明这个样本在“代数上”离分类边界越偏向正确一侧

2)对于整个训练集的函数间隔, 可以定义相对于超平面的函数间隔为：
$$
\hat\gamma = \min_i \hat\gamma_i = \min_i y_i(w^\top x_i+b)
$$表示所有样本里面 最**危险**的那个样本的函数间隔
如果这个最小值大于 0，说明所有训练样本都被正确分类, 如果这个值越大，直觉上“分得越开”
那么,我们直接最大化$\hat\gamma$  但是之前提到了问题 他严重**依赖尺度的参数**
只要分类边界不变，我就可以通过无意义地放大参数，让函数间隔任意大
**所以最大化函数间隔是没有意义的!**

2.几何间隔 本质目标量

1)对超平面：$w^\top x+b=0$
一个点 $x_i$ 到这个超平面的几何距离是：$$
\frac{|w^\top x_i+b|}{\|w\|}
$$分母用来消除法向量的尺度

2)带标签方向的几何间隔:$$
\gamma_i = \frac{y_i(w^\top x_i+b)}{\|w\|}
$$和函数间隔的关系非常简单：$\gamma_i = \frac{\hat\gamma_i}{\|w\|}$
几何间隔 = 函数间隔 / 法向量长度

3)整个数据集的几何间隔$$
\gamma = \min_i \gamma_i = \min_i \frac{y_i(w^\top x_i+b)}{\|w\|}
$$所有训练样本中，离边界最近的那个点，到边界的有符号距离

3.在后面推导SVM 我们会经常写函数间隔 why?
直接最大化几何间隔会得到：$$
\max_{w,b} \min_i \frac{y_i(w^\top x_i+b)}{\|w\|}
$$但是这个函数很难计算 分式结构 约束形式不直观
我们利用缩放自由度做规范化 如果 $(w,b)$ 能正确分类，那么对任意正数 $c$ ，$(cw,cb)$ 也能正确分类
我们直接用掉这个自由度!  规定：$\min_i y_i(w^\top x_i+b)=1$
**把整个训练集的最小函数间隔规范化为 1**
那么几何间隔就是 $\gamma=\frac 1 {||w||}$  
两侧支持超平面之间的总宽度是：$\frac{2}{\|w\|}$
最大化几何间隔 就等价于最小化$||w||$
更常见的 为了方便求导 我们写成 $$\min\frac12\|w\|^2$$
## 硬间隔 SVM
1.**Hard-margin SVM:**
+ 所有样本必须被正确分类
+ 必须满足一个严格的margin 约束
+ 不允许有任何样本越界、误分、松弛
因此他要求一个强前提: **训练数据必须严格线性可分**
我们之前已经说过,利用缩放自由度进行约束$\min_i y_i(w^\top x_i+b)=1$
那么几何间隔就等于 $\gamma=\frac{1}{\|w\|}$
因此最大化间隔等价于最小化 $\frac12\|w\|^2$
于是，**硬间隔 SVM 的原始优化问题（primal problem** 就是：$$
\begin{aligned} \min_{w,b}\quad & \frac12\|w\|^2 \\ \text{s.t.}\quad & y_i(w^\top x_i+b)\ge 1,\quad i=1,\dots,n \end{aligned}
$$对于**目标函数**来说 加1/2 是为了求导方便 $\nabla_w \frac12\|w\|^2 = w$
对于**约束**来说
+ 若 $y_i=+1$，约束变成 $w^\top x_i+b \ge 1$
-  若 $y_i=-1$，约束变成 $w^\top x_i+b \le -1$
所以所有正样本必须在超平面 $w^\top x+b=1$ 的一侧, 所有负样本必须在 $w^\top x+b=-1$ 的另一侧

我们得到一共有三条边界
1).决策边界：$w^\top x+b=0$

2).正侧边界：$w^\top x+b=1$

3).负侧边界：$w^\top x+b=-1$

而这两个“边界超平面”之间的距离是：$\frac{2}{\|w\|}$ 这就是所谓的**margin band**

2.最小化$\|w\|^2$的解读
+ 几何视角: margin是$\frac 1 {\|w\|}$ 更小的 $\|w\|$ 意味着更大的几何margin
+ 正则化视角: 实际上在做一种隐式正则化 $||w||$ 越大 说明函数对输入变化更加的敏感 反之越小 说明分割更加的平缓和克制

3.凸优化分析
$\min_{w,b}\frac12\|w\|^2 \quad \text{s.t.} \quad y_i(w^\top x_i+b)\ge 1$
objective function是convex的, constraint对$(w,b)$都是affine的
所以整个问题来说 是一个 凸二次规划（convex quadratic programming, QP）

4.支持向量 support vectors
大多数样本可能满足的是严格不等式：$y_i(w^\top x_i+b)>1$
这些点离边界更远，它们其实不是最紧约束, 真正“卡住”最优边界的是那些刚好满足：$$
y_i(w^\top x_i+b)=1
$$的数据点.
这些点就在两条支持超平面上，是离决策边界最近的训练点 我们称作**支持向量（support vectors）**
**support means what?**
几何上说,最优间隔带被这些点给支撑住了 
如果没有这些点 边界还能够继续进行移动 margin还能够变大

5.Discussion
? 如果数据不可分怎么半 现实中data往往并不一定线性可分 ->软间隔SVM
? 如果真实决策边界是非线性的怎么办 -> kenerl method
? 它不是概率model -> 与logistic的比较

## 软间隔与 slack variable
硬间隔SVM 我们可以视作SVM的理想model
但是现实情况下 我们往往需要 **软间隔SVM** 去解决
1)现实数据不一定线性可分 2) 有噪声点异常点的问题
![[image-22.png|394]]
1.slack variable
现实数据往往有三种情况
+ 分类正确,离边界够远
+ 分类正确,但是离边界太近 没有达到margin的要求
+ 分类错误
因此我们的目标不应该是 不惜一切代价让所有点都满足严格 margin
而是 大多数点尽量满足大间隔 少数点可以违约 但是违约付出相应的代价

软间隔的 constraint 条件：
$$
y_i(w^\top x_i+b)\ge 1-\xi_i,\quad i=1,\dots,n
$$
并要求 $\xi_i \ge 0$，这里的 $\xi_i$ 就是 **slack variable（松弛变量）**，允许这个点对 margin 要求有一定程度的违反。

$\xi_i$ 的分段意义：
$$
\begin{cases}
\xi_i = 0 & \text{正确分类且在 margin 外} \\
0<\xi_i<1 & \text{正确分类，但落在 margin 内} \\
\xi_i = 1 & \text{落在决策边界上} \\
\xi_i>1 & \text{被误分类}
\end{cases}
$$
2.软间隔 SVM 的原始问题：
优化问题就不再只是最小化 $\|w\|^2$ ，
而要同时惩罚违约 margin violation 违约越严重,惩罚越大
$$
\begin{aligned} \min_{w,b,\xi}\quad & \frac12\|w\|^2 + C\sum_{i=1}^n \xi_i \\ \text{s.t.}\quad & y_i(w^\top x_i+b)\ge 1-\xi_i,\quad i=1,\dots,n\\ & \xi_i\ge 0,\quad i=1,\dots,n \end{aligned}
$$
这就是标准的 **L1 slack soft-margin SVM**
本质上就是在做 “边界尽量简单,间隔尽量大” 和 “训练样本尽量不要违反margin” 的结构化权衡
你想让边界宽松平滑 就会有更多点进入margin 或 误分
你想让每个点满足margin 就会把边界很紧 $||w||$变大
+ 参数C作用
	**大 C** = 强调少违约 更重视训练数据拟合  
	**小 C** = 强调边界简单和大间隔 更重视正则化 / 边界稳定性
+ 优化视角上 仍然是一个凸二次规划 没有破坏SVM的优化优雅性

3.本质形式
我们可以改写约束：$\xi_i \ge 1-y_i(w^\top x_i+b),\quad \xi_i\ge 0$
$$
\xi_i = \max\big(0,\; 1-y_i(w^\top x_i+b)\big)
$$
slack variable 实际上不是独立变量 而是由我们的margin shortfall决定的 
- 如果 $y_i(w^\top x_i+b)\ge 1$，则 $\xi_i=0$
- 如果 $y_i(w^\top x_i+b)<1$，则 $\xi_i$正好等于缺口大小
进一步带回objective:$$
\min_{w,b}\quad \frac12\|w\|^2 + C\sum_{i=1}^n \max(0,1-y_i(w^\top x_i+b))
$$我们后面会学习hinge loss 实际上很接近这个的形式了
所以在结构上看:
**slack variable 版 soft-margin SVM，本质上就是“正则化 + hinge-style经验损失”的优化问题**
## hinge loss
1.hinge loss
定义分类打分函数：$f(x)=w^\top x+b$
对一个带标签样本 $(x_i,y_i)$，其中 $y_i\in\{+1,-1\}$，它的**有符号打分**是： $f(x_i)=y_i(w^\top x_i+b)$
对单个样本，hinge loss 定义为：$$
\ell_{\text{hinge}}(x_i,y_i) = \max\big(0,\;1-y_i f(x_i)\big)
$$
也可以写成分段的形式 ：$$
\ell_{\text{hinge}}(x_i,y_i) = \begin{cases} 0, & y_i f(x_i)\ge 1 \\ 1-y_i f(x_i), & y_i f(x_i)<1 \end{cases}
$$其中$1-y_if(x_i)$可以看作 距离单位margin还差多少的 缺口
![[image-23.png|547]]

2.**slack variable 与 hinge loss 本质上是同一个量的两种表达：**
$$
\xi_i=\ell_{\text{hinge}}(x_i,y_i)
$$
我们之前已经推导过: soft-margin SVM 的原始问题 $\min\limits_{w,b,\xi}\frac12\|w\|^2 + C\sum_i \xi_i$
可以完全等价地写成：$\min\limits_{w,b} \frac12\|w\|^2 + C\sum\limits_{i=1}^n \max(0,1-y_i(w^\top x_i+b))$
所以原始问题就等价于 **正则化项 + hinge loss 经验和** 
+ 相较于 perceptron：$\ell_{\text{perc}}(z)=\max(0,-z)$，perceptron 要的是“分对”，SVM 要的是“分对且留余量”
+ 相较于 logistic：$\ell_{\text{log}}(z)=\log(1+e^{-z})$，SVM 更强调“达到安全 margin 就够了”；Logistic 更强调“概率意义下持续提高置信度”

3.从经验风险最小化看SVM 我们也可以写成一个标准的**正则化风险最小化模型**：
$\min\limits_{w,b} \frac12\|w\|^2 + C\sum\limits_{i=1}^n \ell_{\text{hinge}}(x_i,y_i)$
如果除以 $n$，也可以写成更标准的正则化经验风险形式：
$$
\min_{w,b} \lambda \|w\|^2 + \frac1n\sum_{i=1}^n \ell_{\text{hinge}}(x_i,y_i)
$$

## 优化求解
### 硬间隔SVM
**primal problem**$$
\begin{aligned} \min_{w,b}\quad & \frac12\|w\|^2 \\ \text{s.t.}\quad & y_i(w^\top x_i+b)\ge 1,\quad i=1,\dots,n \end{aligned}
$$在所有满足分类约束的hyperplane里面,找到法向量范数最小的那一个平面
事实上,在低维度时,我们可以直接解primal problem
但是更重要的 我们会把他转换成dual problem
我们后面会讨论具体的原因:

1)dual problem会显露support vector结构

2)dual problem只依赖样本的inner product

3)kernel method只能在这个结构上自然出现

具体可以看优化理论笔记的xxxxx

1.拉格朗日函数
我们通常把约束不等式写作 $g_i(w,b)\le 0$
我们定义 $g_i(w,b)=1-y_i(w^\top x_i+b)$
于是约束就是$$
1-y_i(w^\top x_i+b)\le 0
$$对每个约束引入一个乘子 $\alpha_i\ge 0$，定义拉格朗日函数：
$$
\mathcal{L}(w,b,\alpha) = \frac12\|w\|^2 + \sum_{i=1}^n \alpha_i\big(1-y_i(w^\top x_i+b)\big)
$$这里 $\alpha_i$ 是拉格朗日乘子
第一项是我们的原始目标
第二项在惩罚对约束的违反 如果约束满足的很好 例如$y_i(w^Tx_i+b)\geq 1$ 那么括号里面就是负数 约束就不会紧张 反之违反 就是整数 就会增大langrange函数

2.对偶问题
定义对偶函数：$$
g(\alpha)=\inf_{w,b}\mathcal{L}(w,b,\alpha)
$$固定 $\alpha$, 先对 $w,b$ 做最小化,得到一个只关于 $\alpha$ 的函数
然后再最大化它：$\max\limits_{\alpha\ge 0} g(\alpha)$, 这就是 dual problem

3.推导
$$\mathcal{L}(w,b,\alpha) = \frac{1}{2}\|w\|^2 + \sum_{i=1}^n \alpha_i(1-y_i(w^\top x_i+b))$$把它展开：$$\mathcal{L}(w,b,\alpha) = \frac{1}{2}\|w\|^2 + \sum_{i=1}^n \alpha_i - \sum_{i=1}^n \alpha_i y_i w^\top x_i - b\sum_{i=1}^n \alpha_i y_i$$接下来对 $w$ 和 $b$ 求偏导，并令其为 0
1)对 $w$ 求导 $\frac{\partial \mathcal{L}}{\partial w} = w - \sum\limits_{i=1}^n \alpha_i y_i x_i$   令其为 0：$$w = \sum_{i=1}^n \alpha_i y_i x_i$$观察发现 **最优法向量$w$不是一个任意的向量,而是带符号标签训练样本的线性组合**
- 最终解完全活在训练样本张成的空间里
- 如果某些 $\alpha_i=0$，这些点根本不会进入 $w$ 的表达式
2)对b求导 $\frac{\partial \mathcal{L}}{\partial b} = -\sum\limits_{i=1}^n \alpha_i y_i$  令其为 0：$$\sum_{i=1}^n \alpha_i y_i = 0$$表示正负类样本加权系数必须平衡 最优hyperplane不会偏向某一类无限拉开
3)消掉$w,b$ 带回原式得到 $$\|w\|^2 = \left(\sum_i \alpha_i y_i x_i\right)^\top \left(\sum_j \alpha_j y_j x_j\right) = \sum_i \sum_j \alpha_i \alpha_j y_i y_j x_i^\top x_j$$于是对偶问题变成：$$
\begin{aligned} \max_{\alpha}\quad & \sum_{i=1}^n \alpha_i -\frac12\sum_{i=1}^n\sum_{j=1}^n \alpha_i\alpha_j y_i y_j x_i^\top x_j \\ \text{s.t.}\quad & \alpha_i\ge 0,\quad i=1,\dots,n \\ & \sum_{i=1}^n \alpha_i y_i = 0 \end{aligned}
$$这就是硬间隔 SVM 的对偶问题
4)意义
+ 变量从(w,b)变到了$\alpha$ : 
	primal 在超平面调整参数直接调边界
	dual 去找每个训练样本对应的权重,决定每个训练点对边界样本的影响
+ 目标里只出现了$x_i^Tx_j$ 而没有单独的 $x_i$ 坐标 
	这意味着 **SVM 的求解只依赖于样本之间的相似性（内积），而不依赖于显式坐标表示**, 这就是后面核技巧的数学入口
+ $\alpha_i$衡量样本的重要性 如果$\alpha_i=0$ 那么该样本不直接决定边界 只有$\alpha_i>0$的样本才是真正的活跃

4.KKT条件
Karush-Kuhn-Tucker Conditions:
非线性规划问题（Nonlinear Programming）中，一个点成为**最优解**的**必要条件** 
>考虑广义拉格朗日函数：$$L(x, \lambda, \mu) = f(x) + \sum \lambda_i h_i(x) + \sum \mu_j g_j(x)$$
  其中 $\lambda$ 是等式约束系数，$\mu$ 是不等式约束系数。KKT 条件要求最优解 $x^*$ 必须满足以下四组条件：
  ① 梯度平衡（Stationarity）$$\nabla f(x^*) + \sum \lambda_i \nabla h_i(x^*) + \sum \mu_j \nabla g_j(x^*) = 0$$在最优点处，目标函数的下降方向被约束条件的法向量抵消了，无法再进一步优化
  ② 原始可行性（Primal Feasibility）$$h_i(x^*) = 0, \quad g_j(x^*) \le 0$$最优解必须落在题目要求的“可行域”内，不能违背基本规则
  ③ 对偶可行性（Dual Feasibility）$$\mu_j \ge 0$$不等式约束的乘子必须是非负的。这是为了确保约束力指向可行域内部
  ④ 互补松弛性（Complementary Slackness）—— **灵魂条件**$$\mu_j g_j(x^*) = 0$$这是最关键的一条，它意味着在最优解处，对于每一个不等式约束，要么约束“刚好压线”（$g_j(x^*) = 0$），此时乘子 $\mu_j$ 可以大于 0；要么约束根本没起作用（$g_j(x^*) < 0$），此时乘子 $\mu_j$ 必须等于 0

回到我们的硬间隔问题
- 原始可行性（Primal Feasibility）$y_i(w^\top x_i + b) \ge 1$
- 对偶可行性（Dual Feasibility） $\alpha_i \ge 0$ 拉格朗日乘子非负
- 驻点条件（Stationarity）$w = \sum_i \alpha_i y_i x_i$    $\sum_i \alpha_i y_i = 0$   这是对 $w, b$ 求导得到的
- 互补松弛（Complementary Slackness）$$\alpha_i \big(y_i(w^\top x_i + b) - 1\big) = 0$$
**互补松弛到底想说明什么?**
+ 如果$\alpha_i=0$ 说明这个点对最优边界没有作用 通常发生在$y_i(w^Tx_i+b)>1$ 对情况 就是严格在margin外,离边界远 **不活跃约束**
+ 如果$\alpha_i=0$ 说明这个点刚好落在hyperplane上 这些点就是support vector **活跃约束**
所以说SVM只由少数的点决定 这些点就是support vectors

5.Support vector
KKT 的互补松弛：$\alpha_i>0 \implies y_i(w^\top x_i+b)=1$
可知： 最终决定 $w$ 的，只有那些位于 margin 边界上的点 这些点就是支持向量
所以支持向量的本质：
> **在最优解中，对约束活跃、对法向量表达有非零贡献的样本。**

几何上，它们撑住 margin；  
优化上，它们对应非零乘子；  
表示上，它们构成 $w$ 的稀疏展开

6.dual和primal等价 
具体的看优化理论的讲述
对于硬间隔 SVM，这个问题是凸的，而且满足 Slater 条件（存在严格可行点，因为线性可分时可以把间隔稍微缩放成严格 $>1$ 的形式）因此强对偶成立：$$
\text{primal optimum} = \text{dual optimum}
$$
### 软间隔primal
**软间隔 Primal 问题：**$$\begin{aligned} \min_{w,b,\xi}\quad & \frac{1}{2}\|w\|^2 + C\sum_i \xi_i \\ \text{s.t.}\quad & y_i(w^\top x_i+b) \ge 1-\xi_i \\ & \xi_i \ge 0 \end{aligned}$$有两组约束：
+  $1-\xi_i-y_i(w^\top x_i+b) \le 0$
+  $-\xi_i \le 0$
引入两组乘子 $\alpha_i \ge 0$ 和 $\mu_i \ge 0$
写出langrange函数得到: $$\mathcal{L}(w,b,\xi,\alpha,\mu) = \frac{1}{2}\|w\|^2 + C\sum_i \xi_i + \sum_i \alpha_i(1-\xi_i-y_i(w^\top x_i+b)) - \sum_i \mu_i\xi_i$$对 $\xi_i$ 求导：
$$\frac{\partial \mathcal{L}}{\partial \xi_i} = C - \alpha_i - \mu_i = 0$$
由于 $\mu_i \ge 0$，得到：$$0 \le \alpha_i \le C$$**soft-margin dual 限制了单个样本对超平面的最大影响力**
同样的通过推导我们得到最终形式:$$\begin{aligned} \max_{\alpha}\quad & \sum_i \alpha_i - \frac{1}{2}\sum_i\sum_j \alpha_i\alpha_j y_i y_j x_i^\top x_j \\ \text{s.t.}\quad & 0 \le \alpha_i \le C \\ & \sum_i \alpha_i y_i = 0 \end{aligned}$$和硬间隔相比，唯一新增的重要约束是：$\alpha_i \le C$
在软间隔中，$\alpha_i$ 的取值对应了样本点相对于间隔（margin）的位置：
1. $\alpha_i = 0$：该点在 margin 外（$y_i(w^\top x_i+b) > 1$），分类正确且安全
2. **$0 < \alpha_i < C$**：该点恰好在 margin 边界上（$y_i(w^\top x_i+b) = 1$），是**标准支持向量**此时 $\xi_i = 0$
3. **$\alpha_i = C$**：该点是**违反约束点** 它可能在 margin 内，也可能在超平面上，甚至可能被误分类 此时 $\xi_i > 0$
### 核函数、决策解
在对偶问题中，数据仅以内积形式 $x_i^\top x_j$ 出现。
如果我们把数据映射到高维特征空间 $\phi(x)$，对偶问题只需要计算：
$$\phi(x_i)^\top \phi(x_j)$$
定义核函数 $K(x_i, x_j) = \phi(x_i)^\top \phi(x_j)$，我们就可以在不显式定义 $\phi(x)$ 的情况下处理非线性分类
我们后面会更仔细的讨论这一点

由 $w = \sum_i \alpha_i y_i x_i$ 可得分类函数：
$$f(x) = w^\top x + b = \sum_i \alpha_i y_i x_i^\top x + b$$预测函数为：$$\operatorname{sign}\left(\sum_i \alpha_i y_i x_i^\top x + b\right)$$引入核函数后变为：$$\operatorname{sign}\left(\sum_i \alpha_i y_i K(x_i, x) + b\right)$$**结论： 只有 $\alpha_i > 0$ 的点（支持向量）真正参与了预测过程** 

SVM 的五层本质：
1. 几何：最大间隔
2. 优化：凸约束优化
3. 稀疏：只有关键样本起作用
4. 表示：$w$ 是样本的线性组合
5. 核化：一切只依赖内积

## 支持向量与稀疏表示
### 支持向量
前面的讨论 我们已经知道 
如果我们移动一个离边界非常远的点,optimal boundary是不变的
但是 如果移动一个贴着margin的点 往往可行域和最优边界都会变化
所以 **真正决定 SVM 边界的，不是所有样本，而是那些最靠近决策边界、真正限制了 margin 的样本**

这里我们正式引入support vector的definition:
+ 对偶表示:分类函数可以写成：$f(x) = w^\top x + b = \sum\limits_{i=1}^n \alpha_i y_i x_i^\top x + b$
	如果某个样本 $x_i$ 的 $\alpha_i = 0$，那么它对 $w$ 没有贡献，也就不会直接出现在决策函数中
	优化角度上看 **support vectors: 对应 $\alpha_i > 0$ 的训练样本**
+ KKT条件: KKT 互补松弛条件是：$\alpha_i \big(y_i(w^\top x_i + b) - 1\big) = 0$
	因此，如果 $\alpha_i > 0$，就必须有：$y_i(w^\top x_i + b) = 1$
	几何视角上看 **support vectors: 恰好落在margin边界上的点**
+ 软间隔下更加谨慎:
	margin 外的安全点: 通常 $\alpha_i = 0$，不是支持向量
	恰好在 margin 上的点: 通常 $0 < \alpha_i < C$，是典型支持向量
    落在 margin 内、甚至误分类的点: 常常 $\alpha_i = C$，它们也可能是支持向量
    所以support vectors = 在margin上的点 这个说法只在hard-margin或者某种理想化表述的说法,更加的本质定义还是$\alpha_i>0$ 

### 稀疏表示
前面提到 $w=\sum_i \alpha_i y_i x_i$ 在这个表示里 很多 $\alpha_i$ 都等于0
SVM的稀疏性指的是**样本稀疏**,而非坐标的稀疏
可以从三个角度考虑SVM的稀疏性:
+ KKT 条件的推导：满足 $\alpha_i \bigl(y_i(w^\top x_i+b)-1\bigr)=0$。倘若 $y_i(w^\top x_i+b)-1>0$，那么 $\alpha_i=0$
+ 从hinge loss的角度看 ：$\ell_{\text{hinge}}(x_i,y_i)=\max(0,1-y_if(x_i))$ 如果某个点已经满足$y_if(x_i)\ge 1$ 那么它的 hinge loss 为 0 训练样本的贡献为0
+ 从几何角度看 真正觉得margin的本身就是那些离的最近的点

SVM在做Prediction时候只依赖support vectors
## 核技巧
很多情况下数据直接可能并不线性可分
我们现在问题是 是否存在一个合适的特征映射，使得数据在**映射后的空间**中更容易被线性分开？

定义:核函数 kernel trick
如果存在某个特征映射 $\phi$，使得 $$K(x,z)=\phi(x)^\top \phi(z)$$那么 $K$  就叫做一个核函数 **两个样本在某个特征空间的内积**
注意: 我们并不需要显式的去进入这个高维空间,因为显式构造可能代价很大
eg.考虑一个二次多项式的显式特征映射$\phi(x) = \begin{bmatrix} x_1^2 \\ \sqrt{2}x_1x_2 \\ x_2^2 \end{bmatrix}$
现在我们考虑两个样本的内积$$\begin{align} \phi(x)^\top \phi(z) &= x_1^2 z_1^2 + 2x_1x_2z_1z_2 + x_2^2z_2^2 \\ &= (x^\top z)^2 \end{align}$$所以$K(x,z)=(x^T z)^2$ 

更一般的多项式核: $$K(x, z) = (x^\top z + c)^p$$线性分类器能够去看更高阶的相互交互

RBF / Gaussian kernel:$$K(x, z) = \exp\left( -\frac{\|x - z\|^2}{2\sigma^2} \right)$$衡量的相似度 离的近约等于1 离得远为0
**RBF 核对应一个无限维特征空间** 
它允许决策函数由很多局部相似性叠加而成，因此能够表达非常灵活、非常非线性的边界
决策函数变成:$$f(x) = \sum_{i \in SV} \alpha_i y_i \exp(-\gamma \|x_i - x\|^2) + b$$其中$\gamma = \frac{1}{2\sigma^2}$ 
+ **当 $\gamma$ 很大**：核函数衰减很快 有非常近的点才显著相似 模型更加的局部,灵活 但是也更容易过拟合
+ **当 $\gamma$ 很小**：衰减较慢，很多点彼此都相似 模型更平滑，更接近全局结构

**选择核函数，本质上是在选择一种特征表示与相似性几何，也是在选择模型的归纳偏置**

1. SVM 与 Logistic 都可写成线性打分模型，但它们的学习原则不同：SVM 学的是最大间隔边界，Logistic 学的是条件概率
2. hinge loss 与 logistic loss 的差别，不只是函数形式不同，而是“margin 学习”与“概率拟合”两种目标的体现
3. SVM 是支持向量驱动的边界学习器，Logistic 是全样本驱动的概率学习器
4. SVM 的输出分数天然不是概率；Logistic 的输出天然具有概率解释
5. SVM 的正则项与 margin 有原生几何联系，而 Logistic 的正则项更像附加的复杂度控制机制
