package com.aiplatform.repository;

import com.aiplatform.entity.PromptCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromptCategoryRepository extends JpaRepository<PromptCategory, Long> {

    /**
     * 查找所有启用的分类，按排序顺序排列
     */
    List<PromptCategory> findByIsActiveTrueOrderBySortOrderAsc();

    /**
     * 根据名称查找分类
     */
    PromptCategory findByName(String name);

    /**
     * 检查名称是否已存在
     */
    boolean existsByName(String name);
} 