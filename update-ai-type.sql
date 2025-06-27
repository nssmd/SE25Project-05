-- 更新AI类型数据脚本
-- 将现有的ai_type字段值更新为新的枚举格式

-- 首先修改数据库枚举类型定义
ALTER TABLE chat MODIFY COLUMN ai_type ENUM(
    'text_to_text',
    'text_to_image', 
    'image_to_image',
    'image_to_text',
    'text_to_video',
    'text_to_3d'
);

-- 更新现有数据，将旧格式转换为新格式
-- 如果有其他格式的数据，统一转换为 text_to_text
UPDATE chat SET ai_type = 'text_to_text' WHERE ai_type NOT IN (
    'text_to_text',
    'text_to_image', 
    'image_to_image',
    'image_to_text',
    'text_to_video',
    'text_to_3d'
);

-- 验证更新结果
SELECT ai_type, COUNT(*) as count 
FROM chat 
GROUP BY ai_type;
