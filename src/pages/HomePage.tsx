import { useNavigate } from 'react-router-dom';

interface ToolCard {
  id: string;
  title: string;
  desc: string;
  path: string;
  icon: string;
  color: string;
}

const tools: ToolCard[] = [
  {
    id: 'json-formatter',
    title: 'JSON 格式化工具',
    desc: '格式化、压缩、校验 JSON，支持去转义、Unicode/URL 解码、自动格式化、深色模式、历史记录',
    path: '/json-formatter',
    icon: '{ }',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'watermark-remover',
    title: '图像去水印',
    desc: '上传图片，通过 AI 多模态模型智能去除水印文字和 Logo',
    path: '/watermark-remover',
    icon: '🖼️',
    color: 'from-purple-500 to-purple-600',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">AI 工具集</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          精选在线小工具，提升你的工作效率
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => navigate(tool.path)}
            className="text-left group"
          >
            <div className="h-full p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} text-white text-lg mb-3`}>
                {tool.icon}
              </div>
              <h3 className="text-base font-semibold mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {tool.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* More tools coming soon */}
      <div className="mt-8 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          更多工具开发中……
        </p>
      </div>
    </div>
  );
}
