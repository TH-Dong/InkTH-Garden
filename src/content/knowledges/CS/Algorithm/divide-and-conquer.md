---
title: "分治法基本思想"
date: "2026-04-12"
updated: "2026-04-12"
tags:
  - Algorithm
  - Divide and Conquer
summary: "从递归结构理解分治法中的拆分、求解与合并。"
draft: false
---

## 什么是分治法

分治法（Divide and Conquer）是一种重要的算法设计范式。其核心思想是将一个规模为 $n$ 的问题分解为若干个规模更小的子问题，递归求解后合并结果。

## 基本步骤

1. **分解（Divide）**：将原问题拆分为若干子问题
2. **求解（Conquer）**：递归地解决每个子问题
3. **合并（Combine）**：将子问题的解合并为原问题的解

## 时间复杂度分析

分治算法的时间复杂度通常可以用 **Master 定理** 来分析。对于递推关系：

$$
T(n) = aT\left(\frac{n}{b}\right) + O(n^d)
$$

其中 $a$ 是子问题数，$b$ 是缩小比例，$d$ 是合并步骤的复杂度指数。

### 三种情况

- 若 $d < \log_b a$，则 $T(n) = O(n^{\log_b a})$
- 若 $d = \log_b a$，则 $T(n) = O(n^d \log n)$
- 若 $d > \log_b a$，则 $T(n) = O(n^d)$

## 归并排序示例

归并排序是分治法的经典应用：

```python
def merge_sort(arr: list[int]) -> list[int]:
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)


def merge(left: list[int], right: list[int]) -> list[int]:
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result
```

归并排序的时间复杂度为 $O(n \log n)$，空间复杂度为 $O(n)$。

## 其他常见分治算法

| 算法 | 时间复杂度 | 应用场景 |
|------|-----------|---------|
| 归并排序 | $O(n \log n)$ | 排序 |
| 快速排序 | $O(n \log n)$ 平均 | 排序 |
| 二分查找 | $O(\log n)$ | 有序数组搜索 |
| Strassen 矩阵乘法 | $O(n^{2.807})$ | 矩阵运算 |

> 分治法的关键在于找到合适的分解方式，使得子问题独立且合并代价可控。
