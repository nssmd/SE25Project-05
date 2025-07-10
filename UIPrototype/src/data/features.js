import { Box, FileText, Image, MessageSquare, Brain } from "lucide-react";

const features = [
    { id: 'text_to_text', name: '智能对话', icon: MessageSquare, description: '与AI进行智能对话，支持文本和图片输入' },
    { id: 'smart_image_generation', name: '智能生图', icon: Image, description: '智能图像生成 - 支持文生图和图生图' },
    { id: 'prompt_template_library', name: 'AI模板库', icon: Brain, description: 'Prompt模板管理与分享平台' },
    { id: 'text_to_3d', name: '文生3D', icon: Box, description: '文本生成3D模型' },
];

export default features;