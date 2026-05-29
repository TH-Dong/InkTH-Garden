---
title: "10 并查集"
tags:
  - Union-Found
summary: "并查集，路径压缩，并查集和图遍历的区别"
draft: false
---
Disjoint Set Union / Union-Find
并查集的目的：解决两个元素是否属于同一个Set？
**解决的是一种动态集合关系**：一开始很多element互不相关 之后不断发生merge得关系 同时不断询问这两个元素是否联通？
```text
初始：{1}, {2}, {3}, {4}, {5}

union(1, 2) 之后：
{1, 2}, {3}, {4}, {5}

union(3, 4) 之后：
{1, 2}, {3, 4}, {5}

find(1) == find(2) ? 是
find(1) == find(4) ? 否
```
如果我们用graph去考虑 那么每次都需要dfs/bfs 会很慢
我们所关心的只是 是否在同一个联通块 那么不需要每次重新遍历graph 直接维护set就可

代表元 representative element：
我们不可能每次都完整保存并且比较整个set 所以我们通常会在每个set选取一个**representative element.**
那么到我们判断两个elem是否属于一个set时：
`find(x) == find(y)` 就等价于 `x 所在集合的代表元 == y 所在集合的代表元` 
如果代表元相同，说明它们属于同一个集合；否则不属于
所以我们定义并查集的核心操作
`find(x)`: 找到x元素所在 set 的 representative element

我们往往**用Tree结构来表示Set**
Why？Union-Found 如果每个元素都去记录他对应的representative element 那么在merge得时候 被merge得set每个元素的代表元都需要修改 这是尤其麻烦的
并查集的改进：
**不直接维护每个元素的最终集合编号，而是让每个元素指向一个“父节点”**
用 `parent[x]` 来表示x的父亲节点，如果 `parent[x]==x` 说明x是根结点 即代表元

## 并查集
### 定义
设全集为：$U = \{1, 2, \dots, n\}$
并查集维护的是对 $U$ 的一个划分：$S_1, S_2, \dots, S_k$
满足：
$$\begin{aligned} S_1 \cup S_2 \cup \dots \cup S_k &= U \\ S_i \cap S_j &= \emptyset \quad (i \neq j) \end{aligned}$$
并查集的基本操作：
`Make-Set(x)`：创建只包含 x 的集合  
`Find(x)`：返回 x 所在集合的代表元  
`Union(x, y)`：合并 x 和 y 所在的两个集合

初始化Union-Found：
```python
for i = 1 to n:
    parent[i] = i
    size[i] = 1
```

`findRoot(x)` 操作：
如果 x 不是根，就一直向父节点走，直到走到根
```cpp
int findRoot(int x) {
    while (parent[x] != x) {
        x = parent[x];
    }
    return x;
}
```

问题是，如果树退化成链：`1 <- 2 <- 3 <- 4 <- 5 <- 6`
那么 findRoot 的复杂度就是$O(n)$ 因此我们为了让Union-Found更加高效 我们依靠两个优化
路径压缩；按大小合并 / 按秩合并

### 路径压缩
如果我们执行 `findRoot(6)` 路径如果是 `6 -> 5 -> 4 -> 3 -> 2 -> 1` 那么通过这次查询我们知道6, 5, 4, 3, 2 的根都是 1 所以我们没必要以后还一层层走 可以直接把路径上所有的点挂在root的下面 
```
原来：
6 -> 5 -> 4 -> 3 -> 2 -> 1

压缩后：
6 -> 1
5 -> 1
4 -> 1
3 -> 1
2 -> 1
```

```cpp
//x 原本指向父亲；现在让 x 直接指向根
int findRoot(int x) {
    if (parent[x] != x) {
        parent[x] = findRoot(parent[x]);  // 路径压缩，对遍历的每一个elem都直接连接root
    }
    return parent[x];
}
```
![[image.png]]

路径压缩不是为了让这一次 `find` 更快，而是为了让以后的 `find` 更快
以后再查这些点时，基本一步到根
所以Union-Found的复杂度分析不能只看单次操作 而是要用 **“均摊复杂度”**

### 按大小合并
假设有两棵树：大树 A：1000 个节点  ；小树 B：3 个节点
如果你把大树挂到小树下面 那么大树的大量节点的depth都要增加 
所以更加合理的是**小树挂到大树下面**
这样增加深度的节点数量更少，树整体更不容易变高

我们会去维护 `size[root]` 表示以 `root` 为根的集合大小
```
如果 size[rootX] < size[rootY]：
    rootX 挂到 rootY 下
否则：
    rootY 挂到 rootX 下
```

```cpp
const int MAXN = 100005;  
  
int parentArr[MAXN];  
int setSize[MAXN];  
  
// 初始化：每个元素单独成为一个集合  
void initSet(int n) {  
for (int i = 1; i <= n; i++) {  
parentArr[i] = i;  
setSize[i] = 1;  
}  
}  
  
// 查找 x 所在集合的代表元，并进行路径压缩  
int findRoot(int x) {  
if (parentArr[x] != x) {  
parentArr[x] = findRoot(parentArr[x]);  
}  
return parentArr[x];  
}  
  
// 合并 x 和 y 所在的集合  
void unionSet(int x, int y) {  
int rootX = findRoot(x);  
int rootY = findRoot(y);  
  
if (rootX == rootY) {  
return; // 已经在同一个集合中，不需要合并  
}  
  
// 小集合挂到大集合下面  
if (setSize[rootX] < setSize[rootY]) {  
parentArr[rootX] = rootY;  
setSize[rootY] += setSize[rootX];  
} else {  
parentArr[rootY] = rootX;  
setSize[rootX] += setSize[rootY];  
}  
}  
  
// 判断 x 和 y 是否属于同一集合  
bool isSameSet(int x, int y) {  
return findRoot(x) == findRoot(y);  
}

```

### 按秩合并
`rank[x]` 不一定表示集合大小，而是近似表示树的高度
类似的思想： 低秩树挂到高秩树下面

```cpp
void unionSet(int x, int y) {  
int rootX = findRoot(x);  
int rootY = findRoot(y);  
  
if (rootX == rootY) {  
return;  
}  
  
if (rankArr[rootX] < rankArr[rootY]) {  
parentArr[rootX] = rootY;  
} else if (rankArr[rootX] > rankArr[rootY]) {  
parentArr[rootY] = rootX;  
} else {  
parentArr[rootY] = rootX;  
rankArr[rootX]++;  
}  
}
```

### 复杂度直觉
如果没有优化 
+ find最坏：$O(n)$
+ union最坏：$O(n)$ 
因为树可能退化成linked list
如果只有按照大小合并：树高可以被控制到$O(\log n)$的级别
如果加上路径压缩：$O(\alpha(n))$ $\alpha(n)$为反阿克曼函数 增长及其慢 在任何现实规模的数据里，它都可以近似看成不超过 5

所以工程和竞赛往往理解为：
并查集的 find / union 近似 $O(1)$ 更严谨地说 $O(\alpha(n))$ 

## 典型例题
### 朋友圈 / 集团归并
有 n 个人，给出若干关系：a 和 b 是朋友；  朋友关系具有传递性；  求最后有多少个朋友圈，或者每个朋友圈有多少人

先把每个人初始化成独立集合
每读入一条朋友关系 $(a, b)$，执行 $\operatorname{Union}(a, b)$
最后统计有多少个不同的根节点
如果要统计每个朋友圈人数，就看每个代表元对应的集合大小

### 冗余边检测（redundant edge detection）
给你一个无向图的边序列。原本图应该是一棵树，但现在多了一条边，导致出现环要求找出这条冗余边
“冗余”是指：**按照给定的顺序添加边，哪一条边最先让图从“树”变成了“有环图”**

判断一条边 $(u,v)$ 是否冗余，其实就是判断：在加入这条边之前，$u$ 和 $v$ 是否已经连通。
如果已经连通，那么再加 $(u,v)$ 一定形成环 如果不连通，那么这条边只是把两个连通块连接起来，不会形成环

所以每条边处理时只需要：
$$\operatorname{Find}(u) = \operatorname{Find}(v)?$$

算法设计：
- 按顺序扫描所有边
- 对每条边 $(u,v)$：
    - 如果 $\operatorname{Find}(u) = \operatorname{Find}(v)$，说明这条边连接的是同一个连通块内的两个点，因此它是冗余边。
    - 否则执行 $\operatorname{Union}(u,v)$，把两个连通块合并。

复杂度：设边数为 $m$，点数为 $n$：
$$O(m \cdot \alpha(n))$$

### Kruskal 最小生成树
给定一个带权无向图（weighted undirected graph），要求找一棵最小生成树（Minimum Spanning Tree, MST）

我们知道Kruskal
+ 按边权从小到大排序 
+ 依次尝试加入每条边
	+ 如果这条边不会形成环，就加入生成树
	+ 如果会形成环，就跳过

所以我们只需要在加入$(u,v)$ 这一条边的时候做冗余边检测即可

```cpp
const int MAXN = 100005;  
const int MAXM = 200005;  
  
struct Edge {  
int u;  
int v;  
int w;  
};  
  
Edge edges[MAXM];  
int parentArr[MAXN];  
int setSize[MAXN];  
  
void initSet(int n) {  
for (int i = 1; i <= n; i++) {  
parentArr[i] = i;  
setSize[i] = 1;  
}  
}  
  
int findRoot(int x) {  
if (parentArr[x] != x) {  
parentArr[x] = findRoot(parentArr[x]);  
}  
return parentArr[x];  
}  
  
bool unionSet(int a, int b) {  
int rootA = findRoot(a);  
int rootB = findRoot(b);  
  
if (rootA == rootB) {  
return false; // 合并失败，说明会形成环  
}  
  
if (setSize[rootA] < setSize[rootB]) {  
parentArr[rootA] = rootB;  
setSize[rootB] += setSize[rootA];  
} else {  
parentArr[rootB] = rootA;  
setSize[rootA] += setSize[rootB];  
}  
  
return true;  
}  
  
bool compareEdge(const Edge& a, const Edge& b) {  
return a.w < b.w;  
}  
  
long long kruskal(int n, int m) {  
sort(edges, edges + m, compareEdge);  
initSet(n);  
  
long long totalWeight = 0;  
int selectedEdges = 0;  
  
for (int i = 0; i < m; i++) {  
int u = edges[i].u;  
int v = edges[i].v;  
int w = edges[i].w;  
  
// 若连接两个不同连通块，则选入 MST  
if (unionSet(u, v)) {  
totalWeight += w;  
selectedEdges++;  
  
if (selectedEdges == n - 1) {  
break;  
}  
}  
}  
  
// 若没有选够 n - 1 条边，说明原图不连通  
if (selectedEdges != n - 1) {  
return -1;  
}  
  
return totalWeight;  
}  
  
int main() {  
int n, m;  
cin >> n >> m;  
  
for (int i = 0; i < m; i++) {  
cin >> edges[i].u >> edges[i].v >> edges[i].w;  
}  
  
cout << kruskal(n, m) << '\n';  
  
return 0;  
}
```

### 岛屿合并问题
给定一个二维网格（grid），海水为 $0$，陆地为 $1$。每次操作会把某个海水格子变成陆地。每次操作后，要求输出当前岛屿数量。 两个陆地格子若上下左右相邻，则属于同一个岛屿。

Solution：只合并，不删除
并查集通常处理编号 $1$ 到 $n$ 的元素。二维网格位置 $(r, c)$ 可以映射为一维编号：
$$id = r \times \text{cols} + c + 1$$

算法设计：
维护四个关键变量：
- `parentArr[]`：并查集父节点数组
- `setSize[]`：集合大小
- `land[]`：布尔数组，记录某个格子当前是否是陆地
- `islandCount`：记录当前岛屿数量

**每次新增陆地 $(r, c)$ 的步骤：**
1. 如果它已经是陆地，岛屿数量不变
2. 否则把它标记为陆地，岛屿数加一
3. 检查上下左右四个方向的邻居：
    - 如果邻居在边界内且是陆地，就尝试执行 `Union(current, neighbor)`
    - 如果 `Union` 成功（即两者原本属于不同集合），说明两个岛屿合二为一，`islandCount` 减一

复杂度分析：设网格大小为 $R \times C$，操作次数为 $k$
- 初始化复杂度：$O(R \times C)$
- 每次操作复杂度：
    每次新增陆地最多检查四个方向，涉及并查集的 `Find` 和 `Union`：$$O(\alpha(R \times C))$$
- 总复杂度：$$O(R \times C + k \cdot \alpha(R \times C))$$

## 并查集拓展
### 并查集和图遍历的关系
并查集和图遍历都能处理“connectivity”问题，但它们解决问题的角度不同
+ BFS和DFS：从某个点出发，沿边走出去。关心的是图的实际结构
+ Union-Found：维护的是 哪些点**已经属于同一个连通分量**
BFS / DFS 保留图的路径结构；并查集只保留连通块归属
---
**对于 静态图**：
一次性求所有连通块
BFS / DFS 和并查集都可以

+ BFS / DFS 做法：
	从每个未访问点出发遍历一整块
	每启动一次新的遍历，连通块数量加一
+ 并查集做法：
	初始每个点单独成集合
	扫描每条边 $(u, v)$，执行 $\operatorname{Union}(u, v)$
	最后统计不同代表元数量

复杂度都可以做到：$O(n + m)$
或者并查集写成：$O(n + m\alpha(n))$

---
对于**动态加边 + 多次查询**
不断加边 不断询问两个点是否联通 不删除边 
那么Union-Found更优

因为每次加边只需要：$\operatorname{Union}(u, v)$
每次查询只需要：$\operatorname{Find}(u) = \operatorname{Find}(v)$
如果用 BFS / DFS，每次查询都重新遍历图，最坏可能是：$O(m)$
如果有 $q$ 次查询，总复杂度可能变成：$O(qm)$
而并查集可以做到：
$$O((m+q) \alpha(n))$$
所以动态连通性（dynamic connectivity）里的“只加边、多查询”就是并查集的主场

---
需要路径信息时，并查集不够
因为并查集只回答：是否同集合 它不保存具体路径

同时并查集不能删除边
考虑图：$1-2-3$
执行：$\operatorname{Union}(1,2)$和$\operatorname{Union}(2,3)$
此时并查集认为：
$$\operatorname{Find}(1)=\operatorname{Find}(2)=\operatorname{Find}(3)$$
现在删除边 $(2,3)$。真实图变成：$1-2 \qquad 3$
所以 $1$ 和 $3$ 不再连通 但并查集内部没有保存“$3$ 是因为哪条边才连进来的” 它也不知道删除 $(2,3)$ 后哪些点该分出去

更严重的是，**路径压缩** 可能已经把 $3$ 直接挂到了 $1$ 上 此时父指针甚至不再反映原图边
**并查集的树只是集合表示结构，不是原始图结构**

### 带权并查集
weighted Union-Find
带权并查集还维护： $x$ 和它的父节点之间存在某种权值关系
常见形式是维护：$\text{dist}[x]$
表示 $x$ 到父节点 $\text{parent}[x]$ 的距离或关系值

典型应用
- **维护相对距离**
- **维护食物链关系**（模运算关系）
- **维护变量比例关系**（如 $a/b=2$）
- **判断约束是否矛盾**

假设我们维护：$\text{weight}[x] = x \text{ 到 } \text{parent}[x] \text{ 的距离}$
如果路径是：$x \to p \to r$
那么 $x$ 到根 $r$ 的距离应该是：$\text{weight}[x] + \text{weight}[p]$
路径压缩后，$x$ 直接指向 $r$，所以新的 $\text{weight}[x]$ 应更新为：
$$\text{weight}[x] \leftarrow \text{weight}[x] + \text{weight}[p]$$

```cpp
const int MAXN = 100005;

int parentArr[MAXN];
int distArr[MAXN]; // distArr[x] 表示 x 到 parentArr[x] 的距离

void initSet(int n) {
    for (int i = 1; i <= n; i++) {
        parentArr[i] = i;
        distArr[i] = 0;
    }
}

// 查找根，同时维护 x 到根的距离
int findRoot(int x) {
    if (parentArr[x] == x) {
        return x;
    }

    int oldParent = parentArr[x];
    int root = findRoot(oldParent);

    // 路径压缩时，把 x 到父亲的距离累加上父亲到根的距离
    distArr[x] += distArr[oldParent];
    parentArr[x] = root;

    return root;
}

// 查询 x 到所在集合代表元的距离
int distanceToRoot(int x) {
    findRoot(x);
    return distArr[x];
}
```

### 可回滚并查集
rollback Union-Find
支持“撤销最近一次合并”
可回滚并查集支持一种受限拆分：不是任意删除边，而是按照栈的顺序撤销最近操作

分治处理动态连通性
离线维护时间区间内存在的边
需要回到某个历史状态的算法

路径压缩会一次性修改很多父指针，回滚成本会变得复杂
所以可回滚并查集通常只用按大小合并或按秩合并，并把每次修改记录到栈里
这样撤销，只需要恢复少量变量

**路径压缩虽然快，但它会破坏历史可恢复性**

