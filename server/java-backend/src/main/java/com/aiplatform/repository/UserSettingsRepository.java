package com.aiplatform.repository;

import com.aiplatform.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {

    // 根据用户ID查找设置
    Optional<UserSettings> findByUserId(Long userId);

    // 查找启用自动清理的用户设置
    @Query("SELECT us FROM UserSettings us WHERE us.autoCleanupEnabled = true")
    List<UserSettings> findWithAutoCleanupEnabled();

    // 根据清理频率查找设置
    List<UserSettings> findByCleanupFrequency(UserSettings.CleanupFrequency frequency);

    // 根据最大聊天数查找设置
    @Query("SELECT us FROM UserSettings us WHERE us.maxChats > :minChats")
    List<UserSettings> findWithMaxChatsGreaterThan(@Param("minChats") Integer minChats);

    // 检查用户是否存在设置
    boolean existsByUserId(Long userId);

    // 删除用户设置
    void deleteByUserId(Long userId);

    // 查找需要清理的用户设置（启用自动清理且到了清理时间）
    @Query("SELECT us FROM UserSettings us WHERE us.autoCleanupEnabled = true AND us.cleanupFrequency = :frequency")
    List<UserSettings> findForCleanup(@Param("frequency") UserSettings.CleanupFrequency frequency);
} 