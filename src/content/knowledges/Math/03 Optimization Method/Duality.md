---
title: "04 Duality"
tags:
	- Duality
summary: "对偶的基本概念 拉格朗日乘子法"
draft: false
---


## Lagrangian
对于Optimization问题 我们引入Duality这个工具
这个technique能够帮助我们bound或者solve Optimal values for constrained optimization problems.
我们现在给出一个Orignal Problem 又称作**Primal Problem**  (s.t.表示subject to 代表约束条件)
$$\text{problem } \mathcal{P}: \quad p^* = \min_{\vec{x} \in \mathbb{R}^n} f_0(\vec{x})$$
$$\text{s.t.} \quad \begin{aligned} f_i(\vec{x}) &\le 0, \quad \forall i \in \{1, \dots, m\} \\ h_j(\vec{x}) &= 0, \quad \forall j \in \{1, \dots, p\}. \end{aligned}$$
然后我们denote its **feasible set(可行集)**:
$$\Omega := \left\{ \vec{x} \in \mathbb{R}^n \left| \begin{aligned} f_i(\vec{x}) &\le 0, \quad \forall i \in \{1, \dots, m\} \\ h_j(\vec{x}) &= 0, \quad \forall j \in \{1, \dots, p\} \end{aligned} \right. \right\} $$
我们的对偶性的Magic在于:拉格朗日乘子（Lagrange Multipliers) 将**约束“融入”到了目标函数中**，从而**将一个有约束问题转化为了一个（可能）无约束问题**
而对于无约束的问题 我们就可以考虑去**用Gradient Descent来求解我们的问题**
那么尝试去试着能否完成这个Goal
我们先定义一个Indicator function $\mathbb 1[\cdot]$ ,其中$C(\vec x)$是我们的condition 
$$\mathbb 1[C(\vec{x})] \doteq \begin{cases} 0, & \text{if } C(\vec{x}) \text{ is true,} \\ +\infty, & \text{if } C(\vec{x}) \text{ is false.} \end{cases}$$
那么我们就可以把之前的问题等价成下面这样一个**unconstrained problem:** 
加上我们的indicator function,如果在feasible set里 indicator置零 那么和原问题等价 
如果不在feasible set里面 加上正无穷那么我们求解最小值就无解
将我们的feasible set条件做进一步的分解
$$\begin{aligned} p^* &= \min_{\vec{x} \in \Omega} f_0(\vec{x}) \\ &= \min_{\vec{x} \in \mathbb{R}^n} \left\{ f_0(\vec{x}) + \mathbb 1[\vec{x} \in \Omega] \right\} \\ &= \min_{\vec{x} \in \mathbb{R}^n} \left\{ f_0(\vec{x}) + \sum_{i=1}^m \mathbb 1[f_i(\vec{x}) \le 0] + \sum_{j=1}^p \mathbb 1[h_j(\vec{x}) = 0] \right\}. \end{aligned}$$
那么现在就是一个unconstrained problem 了 但是**梯度下降法require differentiable objective functions that are well-defined**
而indicator function显然是不可微的 因此我们又要去思考怎么表达我们的indicator
$$\mathbb 1[f_i(\vec{x}) \le 0] = \max_{\lambda_i \in \mathbb{R}_+} \lambda_i f_i(\vec{x})$$
Why does this equality hold?
当$f_i(\vec{x})>0$时: 又因为$\lambda>0$ ,我们想要取最大值,我们只需要让$\lambda$趋近于无穷 那么此时也满足indicator的定义
定$f_i(\vec x) \le 0$时: 因为$\lambda>0$ ,所以目标值理论上小于等于0,因此我们要取最大值 只需要让$f=0$就行 此时满足indicator的定义
同样的原因 我们也有 :
$$\mathbb 1[h_j(\vec{x}) = 0] = \max_{\nu_j \in \mathbb{R}} \nu_j h_j(\vec{x}).$$
那么得到了我们最终的形式
$$\begin{aligned} p^* &= \min_{\vec{x} \in \mathbb{R}^n} \left\{ f_0(\vec{x}) + \sum_{i=1}^m \max_{\lambda_i \in \mathbb{R}_+} \lambda_i f_i(\vec{x}) + \sum_{j=1}^p \max_{\nu_j \in \mathbb{R}} \nu_j h_j(\vec{x}) \right\} \\ &= \min_{\vec{x} \in \mathbb{R}^n} \left\{ f_0(\vec{x}) + \max_{\vec{\lambda} \in \mathbb{R}_+^m} \sum_{i=1}^m \lambda_i f_i(\vec{x}) + \max_{\vec{\nu} \in \mathbb{R}^p} \sum_{j=1}^p \nu_j h_j(\vec{x}) \right\} \\ &= \min_{\vec{x} \in \mathbb{R}^n} \max_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} \left\{ f_0(\vec{x}) + \sum_{i=1}^m \lambda_i f_i(\vec{x}) + \sum_{j=1}^p \nu_j h_j(\vec{x}) \right\}. \end{aligned}$$

>Definition (Lagrangian)拉格朗日函数
	The **Lagrangian** of problem $\mathcal{P}$ in (7.1) is the function $L: \mathbb{R}^n \times \mathbb{R}^m \times \mathbb{R}^p \to \mathbb{R}$ given by$$L(\vec{x}, \vec{\lambda}, \vec{\nu}) \doteq f_0(\vec{x}) + \sum_{i=1}^m \lambda_i f_i(\vec{x}) + \sum_{j=1}^p \nu_j h_j(\vec{x})$$
	Additionally $\lambda_i \in \mathbb{R}_+ , \nu_j \in \mathbb{R}$ are called Lagrange multipliers.

Remark:
	我们如何取更好的理解Lagrange multipliers?
	他本质上就是因为你violate他的constrait 而所施加的惩罚项**Penalties** 
	例如$f_i(\vec x)$ 应该要小于等于0 如果你大于0了 那么我就施加这样一个penalties 因为λ本身也大于0 这一项必然大于0 会阻碍你求解最小值
	另外一项也是同理
现在我们就可以把**primal问题用Lagrangian**表示出来
$$p^* = \min_{\vec{x} \in \mathbb{R}^n} \max_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} L(\vec{x}, \vec{\lambda}, \vec{\nu})$$
现在我们要介绍我们的拉格朗日函数的重要的性质

>**Proposition(Lagrangian Properties)**
	For every $\vec{x} \in \mathbb{R}^n$, the function $(\vec{\lambda}, \vec{\nu}) \mapsto L(\vec{x}, \vec{\lambda}, \vec{\nu})$ is an affine function, and hence a concave function. (We also say that $L$ is affine (resp. concave) in $\vec{\lambda}$ and $\vec{\nu}$.)

Proof:
我们先讲解一下Affine(仿射)这个概念:描述$f(x) = ax + b$ 
为什么? 如果我们想要描述$f(x) = ax + b$  我们不能够用线性 
因为很严重的问题是b不为0的时候他不满足Additivity和Homogeneity
因而我们采用Affine这个词语 **“仿射”的本质 = 线性变换 + 平移**
$$g(\vec{x}) = T(\vec{x}) + \vec{b}$$
$T$ 是一个**严格的线性变换**（满足可加性和齐次性，即 $T(\vec{x}) = A\vec{x}$，A是矩阵）
$\vec{b}$ 是一个**常数平移向量** (Translation vector)
同时仿射函数它既是concave，也是convex。因为它上的任意两点连线**正好就在它自己身上**

那么显然这个定理就是很显然的了:  For every $\vec{x} \in \mathbb{R}^n$ 就是在固定我们的x
那么所有的f和g现在都是常数 $$g(\vec{\lambda}, \vec{\nu}) = \underbrace{(c_1 \lambda_1 + c_2 \lambda_2 + \dots)}_{ \text{关于 } \vec{\lambda} \text{ 的线性部分}} + \underbrace{(d_1 \nu_1 + d_2 \nu_2 + \dots)}_{\text{关于 } \vec{\nu} \text{ 的线性部分}} + \underbrace{b}_{\text{常数项}}$$
那么这显然就是一个Affine Function

## Weak Duality
### Dual Problem
那么现在我们就可以正式的引入我们的**Duality**
$$p^* = \min_{\vec{x} \in \mathbb{R}^n} \max_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} L(\vec{x}, \vec{\lambda}, \vec{\nu}).$$
The dual problem is obtained by swapping the min and max:
$$d^* = \max_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} \min_{\vec{x} \in \mathbb{R}^n} L(\vec{x}, \vec{\lambda}, \vec{\nu}).$$
> Definition (Dual Problem)
> For a primal problem $\mathcal{P}$ , its dual problem $\mathcal{D}$ is defined as$$\text{problem } \mathcal{D}: \quad d^* = \max_{\substack{\vec{\lambda} \in \mathbb{R}^m \\ \vec{\nu} \in \mathbb{R}^p}} g(\vec{\lambda}, \vec{\nu})$$$$\text{s.t. } \quad \lambda_i \ge 0, \quad \forall i \in \{1, \dots, m\}.$$
   Here the function $g: \mathbb{R}_+^m \times \mathbb{R}^p \to \mathbb{R}$ is the **dual function** and defined as$$g(\vec{\lambda}, \vec{\nu}) = \min_{\vec{x} \in \mathbb{R}^n} L(\vec{x}, \vec{\lambda}, \vec{\nu}).$$

这个定义就是把我们的dual problem做了一些符号化表示
$g(\vec{\lambda},\vec{\nu})$  是minimum value of $L(\vec{x}, \vec{\lambda}, \vec{\nu})$ over all $\vec x$ 并且是在unconstrained下面来求解问题
> Proposition(Dual Function Concavity)
> 	The dual function $g$ is a concave function of $(\vec{\lambda}, \vec{\nu})$, regardless of any properties of $\mathcal{P}$.

Proof:我们之前已经证明$L$是concave的 现在function $g$ is a pointwise minimum of $L$  那么显然$g$是concave的
因而取求解一个concave最大值或者convex的最小值 那么他就是一个convex Problem
>Corollary 
>	The dual problem $\mathcal{D}$ is always a convex problem, no matter what the primal problem $\mathcal{P}$ is.

那么如果我们能够建立我们的dual problem$\mathcal D$ 和primal problem$\mathcal P$ 的联系 那就表明我们能把解一个任意形式的$\mathcal P$ 改写成解一个**convex problem** 
一旦是convex optimization problem 我们在求解问题就会变得游刃有余了
那么现在我们就来试着描述$p^*$ 和 $d^*$ 的关系
>Proposition 
	Let $\vec{x} \in \Omega$, let $\vec{\lambda} \in \mathbb{R}_+^m$, and let $\vec{\nu} \in \mathbb{R}^p$, so that $\vec{x}$ is feasible for $\mathcal{P}$ and $(\vec{\lambda}, \vec{\nu})$ is feasible for $\mathcal{D}$. Then we have:
	(a) $f_0(\vec{x}) \ge L(\vec{x}, \vec{\lambda}, \vec{\nu}) \ge g(\vec{\lambda}, \vec{\nu})$ ;
	(b) $f_0(\vec{x}) \ge d^*$ and $g(\vec{\lambda}, \vec{\nu}) \le p^*$.

Proof:我们先证明(a):
根据之前的定义 $g(\vec{\lambda}, \vec{\nu}) = \min\limits_{\vec{x} \in \mathbb{R}^n} L(\vec{x}, \vec{\lambda}, \vec{\nu})\le L(\vec{x}, \vec{\lambda}, \vec{\nu})$ 
同时我们在最前面的推导给出了 $f_0(\vec x)=\max\limits_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} L(\vec{x}, \vec{\lambda}, \vec{\nu})\geq L(\vec{x}, \vec{\lambda}, \vec{\nu})$ 
那么(a)证毕

我们给出这个**重要的连不等式**
 $g(\vec{\lambda}, \vec{\nu}) = \min\limits_{\vec{x} \in \mathbb{R}^n} L(\vec{x}, \vec{\lambda}, \vec{\nu})\le L(\vec{x}, \vec{\lambda}, \vec{\nu})\le \max\limits_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} L(\vec{x}, \vec{\lambda}, \vec{\nu}) = f_0(\vec x)$  
 所以$g\le f$ 的
 又因为$d^* = \max\limits_{\substack{\vec{\lambda} \in \mathbb{R}^m \\ \vec{\nu} \in \mathbb{R}^p}} g(\vec{\lambda}, \vec{\nu})$  d是g的最大值 但是g始终小于f 所以g的最大值也小于f
 同理的  $p^* = \min\limits_{\vec{x} \in \mathbb{R}^n} f_0(\vec{x})$ f始终都大于g 所以f的最小值也大于g

### Duality
那么现在我们可以引入我们**对偶性的定义**
>**Definition  (Types of Duality)**
	Let $\mathcal{P}$ be a primal problem with optimum $p^*$. Let $\mathcal{D}$ be the corresponding dual problem with optimum $d^*$.
	(a) If $p^* \ge d^*$ then we say that **weak duality** holds.
	(b) If $p^* = d^*$ then we say that **strong duality** holds.
	(c) The quantity $p^* - d^*$ is called the **duality gap**.

其中**Weak Duality Always Holds** 
> **Proposition**
> 	For any problem, weak duality holds, i.e., the duality gap is non-negative.

下面我们来证明为什么Weak Duality总是成立
先引入一个**Minimax Inequality**
>**Proposition  (Minimax Inequality)**
	Let $X$ and $Y$ be any sets, and $F: X \times Y \to \mathbb{R}$ be any function. Then$$\min_{x \in X} \max_{y \in Y} F(x, y) \ge \max_{y \in Y} \min_{x \in X} F(x, y).$$

Proof: 我们把y看成常数 然后x看作变量 取F的最小值 那么有
$F(x,y)\geq \min\limits_{x' \in X} F(x',y)$    
然后我们两边都去遍历y 去找到F的最大值 那么不等式仍然成立
**实际上这个两边取max不等号仍然成立是 需要证明**
$\max\limits_{y' \in Y} F(x, y') \ge \max\limits_{y' \in Y} \min\limits_{x' \in X} F(x', y')$
现在左边就是关于x的function 右边是一个常数  所以左边的函数大于右边 那么左边的最小值也大于右边常数
$\min\limits_{x \in X} \max\limits_{y \in Y} F(x, y) \ge \max\limits_{y \in Y} \min\limits_{x \in X} F(x, y).$
对于这个不等式 实际上有一个game theoretic interpretation
后手会有信息优势 看左边max后手 因此会更大 右边min后手 因此会更小
根据这个不等式:
我们就得到了:
$$p^* = \min_{\vec{x} \in \mathbb{R}^n} \max_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} L(\vec{x}, \vec{\lambda}, \vec{\nu}) \ge \max_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} \min_{\vec{x} \in \mathbb{R}^n} L(\vec{x}, \vec{\lambda}, \vec{\nu}) = d^*$$
那么现在我们就可以得到下面的关系: 
$$f_0(\vec{x}) \ge p^* \ge d^* \ge g(\vec{\lambda}, \vec{\nu}) \implies f_0(\vec{x}) - g(\vec{\lambda}, \vec{\nu}) \ge f_0(\vec{x}) - p^*$$
能够帮助我们bound一下optimum有多近 因为如果 $f_0(\vec{x}) - g(\vec{\lambda}, \vec{\nu})\le \varepsilon$  那么我们所得到的值距离我们的最优解也满足$f_0(\vec{x}) - p^*\le \varepsilon$.  **This is called a certificate of optimality** 
我们可以利用这个certificate作为一个stopping condition for algorithm 例如说梯度下降

**总结一下这两个重要的不等式:**
$$g(\vec{\lambda}, \vec{\nu}) = \min\limits_{\vec{x} \in \mathbb{R}^n} L(\vec{x}, \vec{\lambda}, \vec{\nu})\le L(\vec{x}, \vec{\lambda}, \vec{\nu})\le \max\limits_{\substack{\vec{\lambda} \in \mathbb{R}_+^m \\ \vec{\nu} \in \mathbb{R}^p}} L(\vec{x}, \vec{\lambda}, \vec{\nu}) = f_0(\vec x)  \implies f_0(\vec{x}) \ge d^* \quad\text{and}\quad g(\vec{\lambda}, \vec{\nu}) \le p^*.
$$$$f_0(\vec{x}) \ge p^* \ge d^* \ge g(\vec{\lambda}, \vec{\nu}) \implies f_0(\vec{x}) - g(\vec{\lambda}, \vec{\nu}) \ge f_0(\vec{x}) - p^*$$
## Strong Duality
在满足强对偶性的前提下:对偶问题（$D$）的最优解”**精确地等于**“原始问题（$P$）的最优解
在最优解 $x^*$ 和 $(\lambda^*, \nu^*)$ 处 $f_0(x^*) - g(\lambda^*, \nu^*) = p^* - d^* = 0$
但是强对偶性需要特定的条件:
+ 第一是需要时Convex Problem 
	补充一下convex Problem的Definition:就是目标函数和小于等于0的约束函数是凸的 然后等于0的约束函数是affine的$$\begin{aligned} & \text{minimize} & & f_0(x) \\ & \text{subject to} & & f_i(x) \le 0, \quad i = 1, \dots, m \\ & & & a_i^T x = b_i, \quad i = 1, \dots, p \end{aligned}$$objective and inequality constraints $f_0, f_1, \dots, f_m$ are convex
	equality constraints are affine, often written as $Ax = b$
	feasible and optimal sets of a convex optimization problem are convex
+ Constraint Qualification 排除一些“病态”的 (pathological) 凸问题
	**在可行域中，必须存在至少一个点，它严格满足所有的不等式约束** 
	就是说存在至少一个可行点 $\tilde{x}$ 
	$f_i(\tilde{x}) < 0$ （对于所有**非仿射(NOT Affined)的**不等式约束 $f_i$）
    $h_j(\tilde{x}) = 0$ （满足所有的等式约束）
>**Theorem  (Slater's Condition)**
	Consider a convex problem $\mathcal{P}$ $$p^* = \min_{\vec{x} \in \mathbb{R}^n} f_0(\vec{x})$$$$\text{s.t.} \quad \begin{aligned} f_i(\vec{x}) &\le 0, \quad \forall i \in \{1, \dots, m\} \\ h_j(\vec{x}) &= 0, \quad \forall j \in \{1, \dots, p\}. \end{aligned}$$
	If there exists any $\vec{x} \in \text{relint}(\Omega)$ which is **strictly feasible**, i.e., such that all of the following hold:
		· for all $i \in \{1, \dots, m\}$ such that $f_i$ is an affine function, we have $f_i(\vec{x}) \le 0$;
		· for all $i \in \{1, \dots, m\}$ such that $f_i$ is **not** an affine function, we have $f_i(\vec{x}) < 0$;
		· and for all $j \in \{1, \dots, p\}$, we have $h_j(\vec{x}) = 0$;
	then **strong duality** holds for $\mathcal{P}$ and its dual $\mathcal{D}$, i.e., the duality gap is 0.

## Simple Application-Shadow Price
>**Example (Shadow Prices).**
> 	In this example, we determine an economic interpretation of Lagrange multipliers.
> 	Suppose we have 200 kilos of merlot grapes and 300 kilos of shiraz grapes. Consider the following possible blends
> 		- 4 kilos merlot, 1 kilo shiraz for $20 per bottle.
> 		- 2 kilos merlot, 3 kilos shiraz for $15 per bottle.

**Solution:**
我们要最大化利润 我们假设第一种做$q_1$瓶 第二种做$q_2$瓶
那么我们有这样的约束关系
$$p^* = \max_{q_1, q_2 \in \mathbb{R}} 20q_1 + 15q_2$$
$$\text{s.t.} \begin{aligned} 4q_1 + 2q_2 &\le 200 \\ q_1 + 3q_2 &\le 300 \\ q_1 &\ge 0 \\ q_2 &\ge 0. \end{aligned}$$
下面我们表示出对应的Lagrangian函数
$$L(q_1, q_2, \lambda_1, \lambda_2) = (20q_1 + 15q_2) - \lambda_1 (4q_1 + 2q_2 - 200) - \lambda_2 (q_1 + 3q_2 - 300)$$
我们可以进一步改写 目的是将 $\lambda$ 赋予**成本/价值**的意义 
$$L = 20q_1 + 15q_2 + \lambda_1 (\underbrace{200 - 4q_1 - 2q_2}_{\text{Merlot 约束}}) + \lambda_2 (\underbrace{300 - q_1 - 3q_2}_{\text{Shiraz 约束}})$$这里的$\lambda$就代表你制酒肯定用不完葡萄 剩下的葡萄你拿去单
现在我们去计算对偶函数$g$
$$g(\lambda_1, \lambda_2) = \max_{q_1, q_2 \ge 0} L(q_1, q_2, \lambda_1, \lambda_2)$$
$$L = q_1 (20 - 4\lambda_1 - \lambda_2) + q_2 (15 - 2\lambda_1 - 3\lambda_2) + (200\lambda_1 + 300\lambda_2)$$
