-- 创建prompt分类表
CREATE TABLE prompt_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    icon VARCHAR(50) COMMENT '图标名称',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Prompt分类表';

-- 创建prompt模板表
CREATE TABLE prompt_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '模板标题',
    description TEXT COMMENT '模板描述',
    content TEXT NOT NULL COMMENT 'Prompt内容',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    ai_model VARCHAR(100) COMMENT '推荐AI模型',
    template_type ENUM('OFFICIAL', 'USER') DEFAULT 'USER' COMMENT '模板类型：官方/用户',
    creator_id BIGINT COMMENT '创建者ID',
    creator_name VARCHAR(100) COMMENT '创建者名称',
    tags VARCHAR(500) COMMENT '标签，逗号分隔',
    language VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言',
    difficulty_level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BEGINNER' COMMENT '难度等级',
    is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
    is_featured BOOLEAN DEFAULT FALSE COMMENT '是否精选',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_id (category_id),
    INDEX idx_template_type (template_type),
    INDEX idx_creator_id (creator_id),
    INDEX idx_is_public (is_public),
    INDEX idx_is_featured (is_featured),
    FOREIGN KEY (category_id) REFERENCES prompt_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Prompt模板表';

-- 创建prompt点赞表
CREATE TABLE prompt_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_id BIGINT NOT NULL COMMENT '模板ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_template_user (template_id, user_id),
    FOREIGN KEY (template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Prompt点赞表';

-- 创建prompt使用统计表
CREATE TABLE prompt_usage_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_id BIGINT NOT NULL COMMENT '模板ID',
    user_id BIGINT COMMENT '使用者ID',
    ai_model VARCHAR(100) COMMENT '使用的AI模型',
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_template_id (template_id),
    INDEX idx_user_id (user_id),
    INDEX idx_used_at (used_at),
    FOREIGN KEY (template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Prompt使用统计表';

-- 插入默认分类数据
INSERT INTO prompt_categories (name, description, icon, sort_order) VALUES
('文本对话', '通用文本对话和问答', 'MessageSquare', 1),
('创意写作', '小说、诗歌、剧本等创意写作', 'Feather', 2),
('代码编程', '编程相关的代码生成和调试', 'Code', 3),
('学习教育', '学习辅导、知识问答', 'BookOpen', 4),
('商务办公', '商务邮件、报告、方案等', 'Briefcase', 5),
('图像生成', '图像描述和生成提示词', 'Image', 6),
('数据分析', '数据处理和分析', 'BarChart', 7),
('翻译润色', '文本翻译和语言润色', 'Languages', 8);

-- 插入一些官方示例模板
INSERT INTO prompt_templates (title, description, content, category_id, ai_model, template_type, creator_name, tags, is_featured) VALUES
('通用聊天助手', '友好的通用AI助手，能够回答各种问题', '你是一个友好、专业的AI助手。请用简洁、准确的语言回答用户的问题，如果不确定答案，请诚实地说明。', 1, 'qwen', 'OFFICIAL', '系统', '通用,助手,问答', TRUE),
('小说情节生成器', '帮助创作引人入胜的小说情节', '你是一个富有创意的小说策划师。请根据用户提供的背景信息，创作出引人入胜、逻辑合理的情节发展。注意保持人物性格的一致性和故事的连贯性。', 2, 'gpt', 'OFFICIAL', '系统', '创意,小说,情节', TRUE),
('Python代码助手', '专业的Python编程助手', '你是一个专业的Python开发工程师。请帮助用户编写高质量、可读性强的Python代码。提供代码时请包含必要的注释和错误处理。', 3, 'deepseek', 'OFFICIAL', '系统', 'Python,编程,代码', TRUE),
('英语学习导师', '专业的英语学习指导', '你是一位经验丰富的英语教师。请用简单易懂的方式解释英语语法、词汇和表达，并提供实用的学习建议和练习。', 4, 'gemini', 'OFFICIAL', '系统', '英语,学习,教育', TRUE),
('商务邮件助手', '专业商务邮件写作助手', '你是一个专业的商务沟通专家。请帮助用户写出得体、专业的商务邮件，注意邮件的格式、语气和内容的逻辑性。', 5, 'qwen', 'OFFICIAL', '系统', '商务,邮件,沟通', TRUE),
('图像描述生成器', '生成详细的图像描述提示词', '你是一个专业的图像描述专家。请根据用户的需求，生成详细、准确的图像描述，包括风格、色彩、构图等要素，适用于AI绘画工具。', 6, '文生图', 'OFFICIAL', '系统', '图像,描述,绘画', TRUE),
('代码优化专家', 'DeepSeek专业代码分析和优化', '你是一个代码优化专家，专长于分析和改进代码性能。请仔细分析用户提供的代码，指出性能瓶颈并提供优化建议。', 3, 'deepseek', 'OFFICIAL', '系统', '代码,优化,性能', TRUE),
('创意文案生成器', 'GPT驱动的营销文案创作', '你是一个创意文案专家。请根据用户的产品或服务信息，创作吸引人的营销文案，注重创意性和说服力。', 2, 'gpt', 'OFFICIAL', '系统', '文案,营销,创意', TRUE),
('多语言翻译助手', 'Gemini多语言智能翻译', '你是一个专业的多语言翻译专家。请提供准确、地道的翻译，并解释文化背景和语言细节。', 8, 'gemini', 'OFFICIAL', '系统', '翻译,多语言,文化', TRUE); 