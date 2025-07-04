import { Box, FileText, Image, MessageSquare, Video } from "lucide-react";

const features = [
    { id: 'text_to_text', name: '文生文', icon: MessageSquare, description: '文本对话生成' },
    { id: 'text_to_image', name: '文生图', icon: Image, description: '根据文本生成图像' },
    { id: 'image_to_image', name: '图生图', icon: Image, description: '图像风格转换' },
    { id: 'image_to_text', name: '图生文', icon: FileText, description: '图像内容描述' },
    { id: 'text_to_video', name: '文生视频', icon: Video, description: '文本生成视频' },
    { id: 'text_to_3d', name: '文生3D', icon: Box, description: '文本生成3D模型' },
];

export default features;