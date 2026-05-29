---
title: "09 哈希表"
tags:
  - Hash Table
summary: "哈希表，哈希函数，哈希冲突，哈希冲突的解决办法，再哈希"
draft: false
---

我们之前已经见到了很多钟search的data structure
+ 数组（array）：如果知道下标，访问是 $O(1)$
+ 链表（linked list）：需要从头扫，查找是 $O(n)$
+ 二叉搜索树（Binary Search Tree, BST）：平均可能是 $O(\log n)$，最坏退化到 $O(n)$
+ 平衡树（balanced tree）：查找、插入、删除通常是 $O(\log n)$
+ 堆（heap）：适合维护最值，不适合任意查找
+ 哈希表的野心更大：它想让“根据 key 查找 value”接近数组按下标访问，也就是平均 $O(1)$

## 哈希函数
数组为什么快？ 因为它支持random access
访问 $a[i]$ 不需要从 $a[0]$ 开始逐个走到 $a[i]$ 计算机可以直接根据基地址和偏移量找到它
$$
\text{address}(a[i]) = \text{base}(a) + i \cdot \text{sizeof(element)}
$$
所以数组按下标访问是 $O(1)$ 
**数组快不是因为它“高级”，而是因为它有一个天然下标** $i$

问题是，现实中的 key 不一定是下标
+ 学生学号：`2024302117`
-  用户名：`"inkth"`

---
哈希函数：把 key 映射成数组下标
哈希函数（hash function）是一个函数：
$$h: U \rightarrow \{0, 1, 2, \dots, m-1\}$$
其中：
- $U$：所有可能 key 的集合，叫**关键字空间**（universe of keys）
- $m$：哈希表底层数组的长度
- $h(k)$：key $k$ 被映射到的数组下标

如果 key 是整数，可以设计：
$$h(k) = k \bmod m$$
例如 $m = 10$：$h(123) = 123 \bmod 10 = 3$ 于是 key `123` 就被放到下标 `3` 的位置。
如果 key 是字符串，可以先把字符串转成一个整数，再对 $m$ 取模 例如：
$$h(s) = \left( \sum_{i=0}^{\text{len}(s)-1} s_i \cdot p^i \right) \bmod m$$
其中 $p$ 是一个常数，$s_i$ 是字符对应的编码值

**核心本质：** ==哈希函数就是把“不适合直接当下标的 key”变成“可以用于数组访问的下标”==

---
==哈希表==是“直接寻址的近似”
对于小范围的key 可以直接寻址 例如 key 只可能是 $0$ 到 $999$，那么可以开一个数组 $a[1000]$
$O(1)$的复杂度而且没冲突 但是直接寻址一旦遇到范围巨大数组空间就会爆炸 而且还会很稀疏浪费空间
**哈希表就是对直接寻址的压缩近似：** 不为每个可能 key 准备一个位置，而是准备一个较小的数组，然后用哈希函数把很多可能 key 压缩到这 $m$ 个位置里

对映射结构来说，它维护的是一组键值对：
$$(k, v)$$
它通常支持以下操作：
- **插入**：$\operatorname{insert}(k, v)$
- **查询**：$\operatorname{find}(k)$
- **删除**：$\operatorname{erase}(k)$
- **判断是否存在**：$\operatorname{contains}(k)$
- **更新**：$\operatorname{update}(k, v)$
理想目标
在哈希表实现下，我们追求的效率是：
$$\operatorname{insert}, \operatorname{find}, \operatorname{erase} \approx O(1)$$
---
冲突不可避免
假设所有可能 key 的数量远大于底层数组长度 $m$，也就是：$|U| > m$
哈希函数要把 $U$ 里的所有 key 映射到 $m$ 个下标里 根据**抽屉原理**，一定存在两个不同的 key：
$k_1 \neq k_2$ 但是：$h(k_1) = h(k_2)$
所以哈希表有两个核心组成：
- **散列函数（hash function）**：决定 key 放到哪里。
- **冲突处理策略（collision resolution）**：多个 key 想去同一个位置时怎么办。

## 拉链法与开放定址法
哈希冲突（hash collision）：
$$
k_1 \neq k_2,\quad h(k_1)=h(k_2)
$$
当多个 key 想占用同一个数组位置时，哈希表到底怎么办？
### 拉链法 separate chaining
底层数组的每个位置不是直接存一个元素，而是存一个链表头
![[image-1.png|577x325]]

$T[0],T[1],\dots,T[m-1]$  其中每个 $T[i]$ 是一个桶（bucket）
例如：$h(23)=10 ,\quad h(36)=10,\quad h(49)=10$
那么：$T[10]: 23 \rightarrow 36 \rightarrow 49$
查找 36 时, 先算：$h(36)=10$  然后只在 $T[10]$ 这条链里找 36

1.`find(x)` 查询
1) 计算桶编号：$idx = h(k)$
2) 进入桶 $T[idx]$
    在桶内逐个比较 key
    如果找到，返回对应 value；否则不存在

复杂度取决于桶的长度 如果所有元素分布均匀，每个桶平均有：$\alpha = \frac{n}{m}$个元素 这里 $\alpha$ 叫负载因子（load factor）
平均查询复杂度大致是：$O(1 + \alpha)$
如果控制 $\alpha$ 为常数，例如 $\alpha \le 0.75$ 或 $\alpha \le 1$，那么平均查询就是：$O(1)$
但如果哈希函数很差，所有元素都进同一个桶，那么查询退化为：$O(n)$

2.`insert(x)` 插入
1) 计算：$idx = h(k)$
2) 在桶 $T[idx]$ 中查找 key 是否已经存在
	如果存在，更新 value
	如果不存在，把新节点插入桶内链表
     常见做法是头插法
     头插的好处是插入本身 $O(1)$，但如果要避免重复 key，仍然需要先在桶里查找
没有去重要求时，插入接近 $O(1)$
有去重或更新语义时，需要先查桶，平均 $O(1 + \alpha)$

3.`delete(x)` 删除
1) 计算：$idx = h(k)$
2) 在桶 $T[idx]$ 的链表里查找 key
	- 找到后修改前驱节点的 next 指针
	    如果使用单链表，需要记录前驱
        如果使用双链表，删除更方便，但空间更大
平均复杂度：$O(1 + \alpha)$
最坏复杂度：$O(n)$

实现
```cpp
#include <iostream>
using namespace std;

const int M = 10007;  // 桶数量，通常取质数

struct Node {
    int key;
    int value;
    Node* next;
};

Node* table[M];

// 初始化哈希表
void initHashTable() {
    for (int i = 0; i < M; i++) {
        table[i] = nullptr;
    }
}

// 处理负数 key，保证下标合法
int hashFunc(int key) {
    int r = key % M;
    if (r < 0) r += M;
    return r;
}

// 在对应桶的链表中查找 key
Node* findNode(int key) {
    int idx = hashFunc(key);

    Node* cur = table[idx];
    while (cur != nullptr) {
        if (cur->key == key) {
            return cur;
        }
        cur = cur->next;
    }

    return nullptr;
}

// 插入或更新 key-value
void put(int key, int value) {
    Node* node = findNode(key);

    if (node != nullptr) {
        node->value = value;  // key 已存在，更新 value
        return;
    }

    int idx = hashFunc(key);

    Node* newNode = new Node;
    newNode->key = key;
    newNode->value = value;

    // 头插法插入当前桶的链表
    newNode->next = table[idx];
    table[idx] = newNode;
}

// 查询 key 对应的 value
bool get(int key, int& value) {
    Node* node = findNode(key);

    if (node == nullptr) {
        return false;
    }

    value = node->value;
    return true;
}

// 删除 key
bool eraseKey(int key) {
    int idx = hashFunc(key);

    Node* cur = table[idx];
    Node* prev = nullptr;

    while (cur != nullptr) {
        if (cur->key == key) {
            if (prev == nullptr) {
                table[idx] = cur->next;
            } else {
                prev->next = cur->next;
            }

            delete cur;
            return true;
        }

        prev = cur;
        cur = cur->next;
    }

    return false;
}

// 释放所有链表节点
void clearHashTable() {
    for (int i = 0; i < M; i++) {
        Node* cur = table[i];

        while (cur != nullptr) {
            Node* nextNode = cur->next;
            delete cur;
            cur = nextNode;
        }

        table[i] = nullptr;
    }
}

void demoHashTable() {
    initHashTable();

    put(23, 100);
    put(36, 200);
    put(23, 300);

    int value;

    if (get(23, value)) {
        cout << value << endl;
    }

    eraseKey(23);

    if (!get(23, value)) {
        cout << "not found" << endl;
    }

    clearHashTable();
}

int main() {
    demoHashTable();
    return 0;
}
```

| **维度**     | **优点**                                                                  | **缺点**                                                     |
| ---------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| **实现与逻辑**  | **实现直观**：冲突处理逻辑简单，直接在对应桶的链表中增删即可                                        | **哈希函数依赖**：如果哈希函数设计不当，元素会堆积在少数桶中，导致链表过长                    |
| **操作便利性**  | **删除自然**：删除节点只需调整链表指针，不会像开放寻址法那样需要处理“伪删除”标记                             | **内存开销**：每个节点都需要额外的指针空间（如 `next` 指针）来维护链表结构                |
| **装载率容忍度** | **对 $\alpha$ 更宽容**：负载因子 $\alpha = \frac{n}{m}$ 可以大于 $1$，即存储元素数量可以超过数组长度 | **性能退化**：虽然允许 $\alpha > 1$，但随着桶变长，查询性能会线性下降                |
| **系统性能**   | **动态扩容压力小**：相比开放寻址法，性能随装载率增加而下降的速度较慢                                    | **缓存局部性差**：链表节点在物理内存中是不连续存储的，CPU 缓存命中率较低（Cache Locality 差） |
### 开放定址法 open addressing
所有元素都必须存放在哈希表数组本身中，如果当前位置被占用，就根据探测规则继续找下一个位置
1) 插入键 $k$ 时，首先检查初始位置：$h(k)$
2)  如果该位置为空，直接放入
	如果该位置已被占用，则根据特定的探测函数产生一系列备选位置：$$h_1(k), h_2(k), h_3(k), \dots$$这一串位置被称为 **探测序列（Probe Sequence）**

---
1.线性探测（linear probing）: 如果原位置被占，就向后一个一个找
$$
h(k,i)=(h(k)+i)\bmod m
$$
如果 10 被占，就试 11；  11 被占，就试 12；
**缺点：主聚集** primary clustering
Eg. 10,11,12,13,14 现在任何哈希到 10 到 14 附近的元素，都可能被迫继续往后探测，使这段连续占用区越来越长 冲突越多，连续块越长；  连续块越长，后续冲突越严重 `insert` 和 `find` 的成本会严重增加 **对负载因子非常敏感**

---
2.二次探测（quadratic probing）
第一次冲突后不一定只往后挪 1 格，而是按照平方级偏移跳着找
$$
h(k,i)=(h(k)+c_1i+c_2i^2)\bmod m
$$
例如：
$$
h(k),\ h(k)+1^2,\ h(k)+2^2,\ h(k)+3^2,\dots
$$
它可以减少线性探测中的主聚集，但仍然可能有次聚集（secondary clustering）
如果两个 key 的**初始哈希位置相同**，那么它们就会走同一条探测路径，后续探测序列也相同

---
3.双重哈希（double hashing）
$$
h(k,i)=\left(h_1(k)+i\cdot h_2(k)\right)\bmod m
$$
$h_1(k)$决定初始位置 $h_2(k)$决定每次跳跃的距离步长
要求 $h_2(k)$ 的设计更小心 通常需要保证探测序列能覆盖整个表 否则可能明明还有空位，却探测不到

---
4.开放寻址法的删除坑点：逻辑删除
假设三个键的哈希值均冲突：
$$h(A)=3, \quad h(B)=3, \quad h(C)=3$$
由于冲突，它们在表中顺序排布：$A \rightarrow 3$ ，$B \rightarrow 4$，$C \rightarrow 5$
若直接物理删除 $A$（将位置 3 置为空）： 查找 $C$ 时，算法先看位置 3，发现“空位”。若逻辑设定“遇空即停”，则会误判 $C$ 不存在

必须引入第三种状态，将桶的状态分为：
- **Empty (空)**：初始状态，从未存储过元素
- **Occupied (占用)**：当前存储有有效元素
- **Deleted / Tombstone (已删除)**：曾有元素，现已移除

- 查找时：
    - 遇到 **Occupied**：对比 Key，匹配则返回
    - 遇到 **Deleted**：视为“此路通车”，**继续探测**
    - 遇到 **Empty**：探测终止，判定不存在  
- 插入时：
    - 探测过程中遇到 **Deleted** 或 **Empty** 位置均可复用（放入新元素并设为 Occupied）

| **维度**            | **拉链法 (Chaining)**                     | **开放寻址法 (Open Addressing)**               |
| ----------------- | -------------------------------------- | ----------------------------------------- |
| **存储方式**          | **数组 + 桶内链表/红黑树**：元素存在数组外的辅助结构中。       | **纯数组**：所有元素都存储在数组内部。                     |
| **冲突处理**          | **同桶共存**：同一哈希值的元素挂在同一个桶下。              | **寻找空位**：冲突后根据探测序列寻找下一个可用位置。              |
| **删除操作**          | **简单自然**：直接移除节点，不影响其他元素。               | **复杂**：需使用 **Tombstone** 标记，否则会破坏探测链。     |
| **负载因子 $\alpha$** | **高容忍度**：$\alpha$ 可大于 $1$，性能随链表变长线性下降。 | **严苛**：必须满足 $\alpha < 1$，且接近 1 时探测次数急剧增加。 |
| **缓存表现**          | **较差**：链表节点在内存中不连续。                    | **优秀**：数组连续存储，充分利用 **Cache Locality**。    |
| **工程特性**          | 实现直观，适合对删除频率高、对内存碎片不敏感的场景。             | 空间紧凑、性能上限高，适合追求极端速度的工程级实现。                |

## 负载因子与再哈希
### 负载因子
负载因子：平均下来每个bucket需要承担的元素的数量。
$$
\alpha = \frac{n}{m}
$$
这是平均值，**不代表每个桶真的一样长**  哈希分布不均匀时，有的桶可能很长，有的桶可能为空

负载因子越大，哈希表越慢
我们以拉链法为例子 查询key $k$ 的流程是先计算其 $\text{idx}(k)$  然后找到相应桶 再在这个桶里一个一个找
所以查询成本大概就是
$$
O(1 + \text{桶内元素数量})
$$
如果哈希函数**足够均匀**，那么平均桶长约为：$\alpha=n/m$ 平均的查询复杂度就是 $O(1+\alpha)$ 
如果我们能保证：$\alpha \leq C$ 就是说控制在一定的常数范围内 那么 $O(1+\alpha)=O(1)$ 

所以Hash Table $O(1)$ 的重要条件
+ **哈希函数分布比较均匀**
+ **负载因子被控制在常数范围内**

### 再哈希（rehashing）
当底层数组的长度固定时，哈希表不能让 $m$ 固定不变 它必须在元素数量变多时扩容
再哈希：换一个更大的底层数组，然后把所有旧元素按照新的哈希规则重新放置
$$
newIdx = h_{new}(k)
$$
（不能够直接copy，比如原来数组长度时10 key=36 那么idx1=6 但是扩容到20的时候 idx2=16了）！
![[image-2.png|450x333]]
再哈希的条件：
通常会设定一个最大load factor $\alpha_{\rm max}$  当$n/m>\alpha_{\rm max}$时 就进行扩容
常见扩容办法：$m' = 2m$ 或者 取大于 $2m$ 的某个质数 

---
再哈希的复杂度分析
1.单词rehash
如果有 $n$ 个元素，一次rehash要重新插入所有的元素 成本是$O(n)$ 
所以，当你分析某一次 `insert` 时 他可能是$O(1)$ 也可能是$O(n)$ 因为他可能触发了rehash

2.但我们往往说 `insert` 均摊 $O(1)$
元素数量从 1 增长到 $n$ 的过程中，扩容规模大致是： $1, 2, 4, 8, \dots, n$
所有扩容搬迁元素的总成本大约是： $1 + 2 + 4 + 8 + \dots + n$
这是一个等比级数：$1 + 2 + 4 + \dots + n < 2n$
所以在 $n$ 次插入过程中，所有 rehash 的总成本是：$O(n)$
普通插入本身也是 $O(n)$ 次，每次平均 $O(1)$
所以总成本： $O(n)$
平均到每次插入： $O(1)$

普通情况下插入平均 $O(1)$  ; 触发 rehash 的那一次插入可能是 $O(n)$ 
长期看，插入的均摊复杂度是 $O(1)$

### 哈希函数的质量
好的哈希函数：让 key 尽量均匀分布到桶中
$$
P(h(k)=i) \approx \frac{1}{m}
$$
这样平均桶长才接近：
$$
\alpha = \frac{n}{m}
$$

**表长取质数** 在取模分析中 $h(k)=k\bmod m$ 表长 $m$ 会影响 idx 的分布
如果说 m 和 key 存在某些共同的规律 那么就更容易产生聚集
例如 key 都是偶数，如果 $m$ 也是偶数，那么某些桶可能永远用不到

取质数可以在很多简单场景下减少这种规律性冲突
但注意：
“表长取质数”不是万能定理，只是常见工程经验之一
现代哈希表实现中，也常用 2 的幂作为表长，但会配合更复杂的哈希扰动或位混合策略

```cpp
//拉链法+自动扩容
#include <iostream>
using namespace std;

struct Node {
    int key;
    int value;
    int next;
};

struct HashTable {
    int bucketCount;
    int size;
    int nodeCapacity;
    int nodeCount;
    int *head;
    Node *nodes;
};

// 处理负数 key，保证下标非负
int getIndex(int key, int bucketCount) {
    int r = key % bucketCount;
    if (r < 0) r += bucketCount;
    return r;
}

// 初始化哈希表
void initHashTable(HashTable &ht, int bucketCount, int nodeCapacity) {
    ht.bucketCount = bucketCount;
    ht.size = 0;
    ht.nodeCapacity = nodeCapacity;
    ht.nodeCount = 0;

    ht.head = new int[bucketCount];
    ht.nodes = new Node[nodeCapacity];

    for (int i = 0; i < bucketCount; i++) {
        ht.head[i] = -1;
    }
}

// 释放内存
void destroyHashTable(HashTable &ht) {
    delete[] ht.head;
    delete[] ht.nodes;

    ht.head = nullptr;
    ht.nodes = nullptr;
    ht.bucketCount = ht.size = ht.nodeCapacity = ht.nodeCount = 0;
}

// 查找 key 对应的节点编号，找不到返回 -1
int findNode(const HashTable &ht, int key) {
    int idx = getIndex(key, ht.bucketCount);

    for (int p = ht.head[idx]; p != -1; p = ht.nodes[p].next) {
        if (ht.nodes[p].key == key) {
            return p;
        }
    }

    return -1;
}

// 重新建表：扩大桶数组，然后把旧节点重新分配到新桶
void rehash(HashTable &ht) {
    int oldBucketCount = ht.bucketCount;
    int oldNodeCapacity = ht.nodeCapacity;
    int oldNodeCount = ht.nodeCount;
    int *oldHead = ht.head;
    Node *oldNodes = ht.nodes;

    int newBucketCount = oldBucketCount * 2 + 1;
    int newNodeCapacity = oldNodeCapacity * 2;

    ht.bucketCount = newBucketCount;
    ht.nodeCapacity = newNodeCapacity;
    ht.nodeCount = 0;
    ht.size = 0;

    ht.head = new int[newBucketCount];
    ht.nodes = new Node[newNodeCapacity];

    for (int i = 0; i < newBucketCount; i++) {
        ht.head[i] = -1;
    }

    // 重新插入所有旧节点
    for (int i = 0; i < oldNodeCount; i++) {
        int key = oldNodes[i].key;
        int value = oldNodes[i].value;
        int idx = getIndex(key, ht.bucketCount);

        ht.nodes[ht.nodeCount].key = key;
        ht.nodes[ht.nodeCount].value = value;
        ht.nodes[ht.nodeCount].next = ht.head[idx];
        ht.head[idx] = ht.nodeCount;

        ht.nodeCount++;
        ht.size++;
    }

    delete[] oldHead;
    delete[] oldNodes;
}

// 插入或更新 key-value
void put(HashTable &ht, int key, int value) {
    int node = findNode(ht, key);

    if (node != -1) {
        ht.nodes[node].value = value;
        return;
    }

    // 负载因子超过 0.75 时扩容：size / bucketCount > 0.75
    if ((ht.size + 1) * 4 > ht.bucketCount * 3) {
        rehash(ht);
    }

    int idx = getIndex(key, ht.bucketCount);

    ht.nodes[ht.nodeCount].key = key;
    ht.nodes[ht.nodeCount].value = value;
    ht.nodes[ht.nodeCount].next = ht.head[idx];
    ht.head[idx] = ht.nodeCount;

    ht.nodeCount++;
    ht.size++;
}

// 查询 key
bool get(const HashTable &ht, int key, int &value) {
    int node = findNode(ht, key);

    if (node == -1) {
        return false;
    }

    value = ht.nodes[node].value;
    return true;
}

// 删除 key
bool eraseKey(HashTable &ht, int key) {
    int idx = getIndex(key, ht.bucketCount);
    int prev = -1;

    for (int p = ht.head[idx]; p != -1; p = ht.nodes[p].next) {
        if (ht.nodes[p].key == key) {
            if (prev == -1) {
                ht.head[idx] = ht.nodes[p].next;
            } else {
                ht.nodes[prev].next = ht.nodes[p].next;
            }

            ht.size--;
            return true;
        }

        prev = p;
    }

    return false;
}

void demoHashTable() {
    HashTable ht;
    initHashTable(ht, 7, 100);

    put(ht, 23, 100);
    put(ht, 36, 200);
    put(ht, 49, 300);
    put(ht, 23, 999);

    int value;
    if (get(ht, 23, value)) {
        cout << value << endl;
    }

    eraseKey(ht, 36);

    if (!get(ht, 36, value)) {
        cout << "not found" << endl;
    }

    destroyHashTable(ht);
}

int main() {
    demoHashTable();
    return 0;
}

```

## 典型例题
### 两数之和
Problem：给定数组： $a[0], a[1], \dots, a[n-1]$ 和目标值： $target$ 要求找到两个不同下标 $i, j$，使得：
$$a[i] + a[j] = target$$

分析：
暴力做法是枚举所有二元组：$(i, j)$ 检查：
$$a[i] + a[j] = target$$
时间复杂度：$O(n^2)$
但如果固定当前数：$x = a[i]$ 那么另一个数必须是：$target - x$
所以问题变成：在之前扫过的数里，是否存在 $target - x$？
如果还要返回下标，就还要知道它出现的位置。所以哈希表维护：$value \rightarrow index$

算法设计：
1) 从左到右扫描数组
2) 遍历到下标 $i$ 时，令：
    $need = target - a[i]$
	查哈希表中是否有 $need$
	    如果有，设它之前出现的位置是 $pos$，那么：
		    $a[pos] + a[i] = target$
		    返回 $pos, i$
		如果没有，就把当前数放进哈希表：$a[i] \rightarrow i$

```cpp
const int MAXN = 100005;
const int MOD = 200003;   // 桶数，取较大的质数

int head[MOD];
int keyArr[MAXN], valArr[MAXN], nxt[MAXN];
int tot;

void initHash() {
    for (int i = 0; i < MOD; i++) head[i] = -1;
    tot = 0;
}

int hashFunc(int key) {
    int r = key % MOD;
    if (r < 0) r += MOD;
    return r;
}

int findValue(int key) {
    int idx = hashFunc(key);
    for (int p = head[idx]; p != -1; p = nxt[p]) {
        if (keyArr[p] == key) return valArr[p];
    }
    return -1;
}

void insertKey(int key, int value) {
    if (findValue(key) != -1) return;
    int idx = hashFunc(key);
    keyArr[tot] = key;
    valArr[tot] = value;
    nxt[tot] = head[idx];
    head[idx] = tot;
    tot++;
}

bool twoSum(int a[], int n, int target, int &ans1, int &ans2) {
    initHash();
    for (int i = 0; i < n; i++) {
        int need = target - a[i];
        int pos = findValue(need);
        if (pos != -1) {
            ans1 = pos; ans2 = i;
            return true;
        }
        insertKey(a[i], i);
    }
    return false;
}
```

### 最近重复元素
给定数组 $a$ 和整数 $K$，判断是否存在两个不同下标 $i, j$，使得：$a[i] = a[j]$ ; 并且：$|i - j| \leq K$

当遍历到位置 $i$ 时，如果当前值是 $x = a[i]$，你需要知道：$x$ 上一次出现在哪里？
所以哈希表维护：
$$value \rightarrow lastIndex$$
1. 从左到右扫描数组。
2. 对每个位置 $i$，令 $x = a[i]$：
3. 查哈希表中是否存在 $x$。
    - 如果不存在，记录：$lastIndex[x] = i$。
    - 如果存在，设上次出现位置为 $j = lastIndex[x]$：
        - 检查：$i - j \leq K$。如果成立，返回 true。
        - 否则更新最近位置：$lastIndex[x] = i$。

- **时间复杂度：** 每个元素查询一次、更新一次。平均为 $O(n)$
- **空间复杂度：** $O(k)$，其中 $k$ 是不同元素个数，最坏为 $O(n)$