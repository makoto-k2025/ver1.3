import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { GeneratedPost, ImageTone, AdjustmentParams, DiagramType } from '../types';
import { generateImage, generateStructure } from '../services/geminiService';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ImageIcon } from './icons/ImageIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { StructureIcon } from './icons/StructureIcon';
import { Slider } from './ui/Slider';

declare global {
  const mermaid: any;
}

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const addParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={`p-${elements.length}`} className="my-4 whitespace-pre-wrap">
          {currentParagraph.join('\n')}
        </p>
      );
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      addParagraph();
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md my-4 overflow-x-auto">
            <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {codeBlockContent.join('\n')}
            </code>
          </pre>
        );
        codeBlockContent = [];
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    if (line.startsWith('## ')) {
      addParagraph();
      elements.push(<h2 key={i} className="text-2xl font-bold mt-6 mb-3 text-gray-800 dark:text-white">{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
      addParagraph();
      elements.push(<h3 key={i} className="text-xl font-bold mt-4 mb-2 text-gray-800 dark:text-gray-100">{line.substring(4)}</h3>);
    } else if (line.startsWith('> ')) {
      addParagraph();
      elements.push(<blockquote key={i} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-600 dark:text-gray-400">{line.substring(2)}</blockquote>);
    } else {
      currentParagraph.push(line);
    }
  }

  addParagraph();

  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <pre key="code-final" className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md my-4 overflow-x-auto">
        <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
          {codeBlockContent.join('\n')}
        </code>
      </pre>
    );
  }

  return <>{elements}</>;
};

const BookmarkIcon: React.FC<BookmarkIconProps> = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill={filled ? "currentColor" : "none"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const AdjustIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 4a1 1 0 00-2 0v2.586a1 1 0 00.293.707l5.414 5.414a1 1 0 00.707.293H15a1 1 0 000-2h-1.586a1 1 0 00-.707-.293L7 5.414A1 1 0 006.707 4.707V4zM15 4a1 1 0 10-2 0v2.586a1 1 0 00.293.707l-2.414 2.414a1 1 0 00-.293.707V16a1 1 0 102 0v-4.586a1 1 0 00-.293-.707l2.414-2.414A1 1 0 0015.707 6.707V4z" />
    </svg>
);

interface BookmarkIconProps {
  filled?: boolean;
}

interface PostCardProps {
  post: GeneratedPost;
  onSavePost: (post: GeneratedPost) => void;
  isSaved: boolean;
  onAdjustPost: (postId: string, params: AdjustmentParams) => void;
  isAdjusting: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onSavePost, isSaved, onAdjustPost, isAdjusting }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [adjustment, setAdjustment] = useState<AdjustmentParams>({});

  const [showStructurePanel, setShowStructurePanel] = useState(false);
  const [detailLevel, setDetailLevel] = useState(3);
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);
  const mermaidContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mermaidCode && mermaidContainerRef.current) {
        try {
            mermaid.render(`mermaid-svg-${post.id}-${Date.now()}`, mermaidCode)
                .then(({ svg }: { svg: string }) => {
                    if (mermaidContainerRef.current) {
                        mermaidContainerRef.current.innerHTML = svg;
                    }
                })
                .catch((e: any) => {
                     if (mermaidContainerRef.current) {
                        mermaidContainerRef.current.innerHTML = `<div class="text-red-500">図のレンダリングに失敗しました。<br/>${e.message}</div>`;
                    }
                });
        } catch (e: any) {
            if (mermaidContainerRef.current) {
                mermaidContainerRef.current.innerHTML = `<div class="text-red-500">図のレンダリングに失敗しました。<br/>${e.message}</div>`;
            }
        }
    }
  }, [mermaidCode, post.id]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(post.post).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [post.post]);

  const handleGenerateImage = async (tone: ImageTone) => {
    setShowImageOptions(false);
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setImageError(null);
    try {
      const imageUrl = await generateImage(post.post, tone);
      setGeneratedImage(imageUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated_image_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdjustSubmit = () => {
    onAdjustPost(post.id!, adjustment);
  };
  
  const updateAdjustment = (param: keyof AdjustmentParams, value: string | undefined) => {
    setAdjustment(prev => ({ ...prev, [param]: value }));
  };

  const handleGenerateStructure = async () => {
    setIsGeneratingStructure(true);
    setStructureError(null);
    setMermaidCode(null);
    try {
        const code = await generateStructure({
            postContent: post.post,
            detailLevel,
            diagramType,
        });
        setMermaidCode(code);
    } catch (err) {
        setStructureError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
        setIsGeneratingStructure(false);
    }
  };

  const handleDownloadDiagram = () => {
    if (mermaidContainerRef.current) {
        const svgElement = mermaidContainerRef.current.querySelector('svg');
        if (svgElement) {
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagram_${diagramType}_${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
  };

  const AdjustmentPanel = () => (
    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 mt-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">投稿を調整</h4>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">文章の長さ</label>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => updateAdjustment('length', adjustment.length === 'shorter' ? undefined : 'shorter')}
              className={`text-sm px-3 py-1 rounded-lg transition ${adjustment.length === 'shorter' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
            >
              短くする
            </button>
            <button
              onClick={() => updateAdjustment('length', adjustment.length === 'longer' ? undefined : 'longer')}
              className={`text-sm px-3 py-1 rounded-lg transition ${adjustment.length === 'longer' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
            >
              長くする
            </button>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">投稿の難易度</label>
          <div className="flex gap-2 mt-1">
            <button
               onClick={() => updateAdjustment('difficulty', adjustment.difficulty === 'simpler' ? undefined : 'simpler')}
              className={`text-sm px-3 py-1 rounded-lg transition ${adjustment.difficulty === 'simpler' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
            >
              よりやさしく
            </button>
            <button
              onClick={() => updateAdjustment('difficulty', adjustment.difficulty === 'more_expert' ? undefined : 'more_expert')}
              className={`text-sm px-3 py-1 rounded-lg transition ${adjustment.difficulty === 'more_expert' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}
            >
              より専門的に
            </button>
          </div>
        </div>
        <div>
          <label htmlFor={`instruction-${post.id}`} className="text-sm font-medium text-gray-600 dark:text-gray-300">追加の指示</label>
          <textarea
            id={`instruction-${post.id}`}
            value={adjustment.instruction || ''}
            onChange={(e) => updateAdjustment('instruction', e.target.value)}
            placeholder="例：もっと親しみやすいトーンで"
            className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
            rows={2}
          />
        </div>
        <div className="flex justify-end">
            <button 
                onClick={handleAdjustSubmit} 
                disabled={isAdjusting}
                className="flex items-center justify-center min-w-[140px] px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
            >
                {isAdjusting ? <SpinnerIcon /> : 'この内容で調整する'}
            </button>
        </div>
      </div>
    </div>
  );

  const detailLevelLabels: { [key: number]: string } = {1: '簡易', 2: '基本', 3: '標準', 4: '詳細', 5: '専門'};

  const StructurePanel = () => (
    <div className="bg-gray-100 dark:bg-gray-900/50 p-4 mt-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">投稿を構造化</h4>
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">図の種類</label>
                <div className="flex gap-2 mt-1">
                    <button onClick={() => setDiagramType('flowchart')} className={`text-sm px-3 py-1 rounded-lg transition ${diagramType === 'flowchart' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>フローチャート</button>
                    <button onClick={() => setDiagramType('sequence')} className={`text-sm px-3 py-1 rounded-lg transition ${diagramType === 'sequence' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>シーケンス図</button>
                </div>
            </div>
            <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">構造レベル</label>
                 <Slider
                    label={detailLevelLabels[detailLevel]}
                    value={detailLevel}
                    min={1} max={5} step={1}
                    onChange={(val) => setDetailLevel(val)}
                  />
            </div>
             <div className="flex justify-end">
                <button onClick={handleGenerateStructure} disabled={isGeneratingStructure} className="flex items-center justify-center min-w-[140px] px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition">
                    {isGeneratingStructure ? <SpinnerIcon /> : '構造を生成'}
                </button>
            </div>
        </div>

        {isGeneratingStructure && (
            <div className="flex justify-center items-center h-48 bg-gray-200 dark:bg-gray-800 rounded-md mt-4">
                <SpinnerIcon />
                <span className="ml-2">構造を生成中...</span>
            </div>
        )}
        {structureError && (
             <div className="text-center p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md mt-4">
                {structureError}
            </div>
        )}
        {mermaidCode && (
            <div className="mt-4 space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Mermaidコード（編集可能）</label>
                    <textarea value={mermaidCode} onChange={(e) => setMermaidCode(e.target.value)} className="w-full mt-1 p-2 h-40 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">プレビュー</label>
                         <button onClick={handleDownloadDiagram} className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label="図をダウンロード">
                            <DownloadIcon />
                        </button>
                    </div>
                    <div ref={mermaidContainerRef} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex justify-center items-center min-h-[200px] overflow-x-auto">
                        {/* Mermaid SVG will be rendered here */}
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-[1.01] hover:shadow-xl">
      <div className="p-6">
        {isGeneratingImage && (
            <div className="flex justify-center items-center h-48 bg-gray-100 dark:bg-gray-700 rounded-md mb-4">
                <SpinnerIcon />
                <span className="ml-2">画像を生成中...</span>
            </div>
        )}
        {imageError && (
             <div className="text-center p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md mb-4">
                {imageError}
            </div>
        )}
        {generatedImage && (
            <div className="mb-4 group relative">
                <img src={generatedImage} alt="Generated cover" className="w-full rounded-md" />
                 <button 
                    onClick={downloadImage}
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
                    aria-label="画像をダウンロード"
                 >
                    <DownloadIcon />
                </button>
            </div>
        )}
        <div className="text-gray-800 dark:text-gray-200">
          <MarkdownRenderer content={post.post} />
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
        <div>
          <h3 className="font-semibold text-sm text-blue-600 dark:text-blue-400">
            投稿の意図 / フック
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {post.intent}
          </p>
        </div>
         {showAdjustPanel && <AdjustmentPanel />}
         {showStructurePanel && <StructurePanel />}
         <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-end items-center space-x-2">
            {showImageOptions && (
                <div className="flex gap-2" onMouseLeave={() => setShowImageOptions(false)}>
                    <button onClick={() => handleGenerateImage('line-art')} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition">ラインアート</button>
                    <button onClick={() => handleGenerateImage('watercolor')} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition">淡い水彩画</button>
                    <button onClick={() => handleGenerateImage('creative')} className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition">AIおまかせ</button>
                </div>
            )}
             <button
                onClick={() => setShowImageOptions(!showImageOptions)}
                className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="画像を生成"
                disabled={isGeneratingImage || isAdjusting}
             >
                <ImageIcon />
            </button>
             <button
                onClick={() => setShowStructurePanel(!showStructurePanel)}
                className={`p-2 rounded-full transition-colors ${showStructurePanel ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                aria-label="投稿を構造化"
                disabled={isAdjusting}
            >
                <StructureIcon />
            </button>
            <button
                onClick={() => setShowAdjustPanel(!showAdjustPanel)}
                className={`p-2 rounded-full transition-colors ${showAdjustPanel ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                aria-label="投稿を調整"
                disabled={isAdjusting}
            >
                <AdjustIcon />
            </button>
            <button
                onClick={() => onSavePost(post)}
                className={`p-2 rounded-full transition-colors ${
                    isSaved
                    ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400 cursor-default'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled={isSaved || isAdjusting}
                aria-label={isSaved ? "保存済み" : "保存"}
            >
                <BookmarkIcon filled={isSaved} />
            </button>
            <button
                onClick={handleCopy}
                className={`p-2 rounded-full transition-colors ${
                    isCopied
                    ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled={isCopied || isAdjusting}
                aria-label={isCopied ? "コピー済み" : "コピー"}
            >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
        </div>
      </div>
    </div>
  );
};