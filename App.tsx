
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { generatePosts, adjustPost } from './services/geminiService';
import type { GeneratedPost, Difficulty, AdjustmentParams } from './types';
import { CopyIcon } from './components/icons/CopyIcon';
import { CheckIcon } from './components/icons/CheckIcon';

const TrashIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);


interface SavedPostCardProps {
  post: GeneratedPost;
  onDeletePost: (postId: string) => void;
}

const SavedPostCard: React.FC<SavedPostCardProps> = ({ post, onDeletePost }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(post.post).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [post.post]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
          {post.post}
        </p>
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
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-end items-center space-x-2">
            <button
              onClick={() => onDeletePost(post.id!)}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="削除"
            >
              <TrashIcon />
            </button>
            <button
                onClick={handleCopy}
                className={`p-2 rounded-full transition-colors ${
                    isCopied
                    ? 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                disabled={isCopied}
                aria-label={isCopied ? "コピー済み" : "コピー"}
            >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
            </button>
        </div>
      </div>
    </div>
  );
};

interface SavedSectionProps {
  posts: GeneratedPost[];
  onDeletePost: (postId: string) => void;
}

const SavedSection: React.FC<SavedSectionProps> = ({ posts, onDeletePost }) => {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">保存した投稿</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <SavedPostCard key={post.id} post={post} onDeletePost={onDeletePost} />
        ))}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [direction, setDirection] = useState<string>('');
  const [charCount, setCharCount] = useState<{ min: number; max: number }>({ min: 300, max: 600 });
  const [difficulty, setDifficulty] = useState<Difficulty>(3);
  const [isThinkingMode, setIsThinkingMode] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<GeneratedPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [copyDocsSuccess, setCopyDocsSuccess] = useState<boolean>(false);
  const [adjustingPostId, setAdjustingPostId] = useState<string | null>(null);


  useEffect(() => {
    try {
      const storedPosts = localStorage.getItem('savedSocialPosts');
      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts);
        const postsWithIds = parsedPosts.map((p: GeneratedPost, i: number) => ({
          ...p,
          id: p.id || `saved-${Date.now()}-${i}`
        }));
        setSavedPosts(postsWithIds);
      }
    } catch (e) {
      console.error("Failed to parse saved posts from localStorage", e);
      setSavedPosts([]);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError("トピックを入力してください。");
      return;
    }
    setIsLoading(true);
    setError(null);
    setPosts([]);
    try {
      const result = await generatePosts({
        topic,
        direction,
        minLength: charCount.min,
        maxLength: charCount.max,
        difficulty,
        isThinkingMode,
      });
       const postsWithIds = result.map((p, i) => ({
        ...p,
        id: `${Date.now()}-${i}`
      }));
      setPosts(postsWithIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "不明なエラーが発生しました。");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [topic, direction, charCount, difficulty, isThinkingMode]);

  const handleCopyToCSV = useCallback(() => {
    if (posts.length === 0) return;
    const csvContent = posts
      .map(p => `"${p.post.replace(/"/g, '""')}"`)
      .join('\n');
    navigator.clipboard.writeText(csvContent).then(() => {
      setCopySuccess(true);
    });
  }, [posts]);
  
  const handleSavePost = useCallback((postToSave: GeneratedPost) => {
    if (savedPosts.some(p => p.post === postToSave.post)) {
      return;
    }
    const newSavedPosts = [...savedPosts, postToSave];
    setSavedPosts(newSavedPosts);
    localStorage.setItem('savedSocialPosts', JSON.stringify(newSavedPosts));
  }, [savedPosts]);

  const handleDeletePost = useCallback((postId: string) => {
    const newSavedPosts = savedPosts.filter(p => p.id !== postId);
    setSavedPosts(newSavedPosts);
    localStorage.setItem('savedSocialPosts', JSON.stringify(newSavedPosts));
  }, [savedPosts]);

  const handleAdjustPost = useCallback(async (postId: string, params: AdjustmentParams) => {
    const originalPost = posts.find(p => p.id === postId);
    if (!originalPost) return;

    if (!params.length && !params.difficulty && (!params.instruction || params.instruction.trim() === '')) {
      return;
    }

    setAdjustingPostId(postId);
    setError(null);

    try {
        const newPost = await adjustPost(originalPost, params);
        const newPostWithId = { ...newPost, id: postId };
        setPosts(currentPosts => 
            currentPosts.map(p => p.id === postId ? newPostWithId : p)
        );
    } catch (err) {
        setError(err instanceof Error ? err.message : "投稿の調整に失敗しました。");
        console.error(err);
    } finally {
        setAdjustingPostId(null);
    }
  }, [posts]);

  const handleCopyToGoogleDocs = useCallback(() => {
    if (posts.length === 0) return;
    const content = posts.map(p => 
      `## 投稿\n\n${p.post}\n\n### 投稿の意図 / フック\n\n${p.intent}`
    ).join('\n\n---\n\n');
    
    navigator.clipboard.writeText(content).then(() => {
        setCopyDocsSuccess(true);
    });
  }, [posts]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);
  
  useEffect(() => {
    if (copyDocsSuccess) {
      const timer = setTimeout(() => setCopyDocsSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyDocsSuccess]);


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <InputSection
            topic={topic}
            setTopic={setTopic}
            direction={direction}
            setDirection={setDirection}
            charCount={charCount}
            setCharCount={setCharCount}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            isThinkingMode={isThinkingMode}
            setIsThinkingMode={setIsThinkingMode}
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />
          <ResultSection
            posts={posts}
            isLoading={isLoading}
            error={error}
            onCopyToCSV={handleCopyToCSV}
            copySuccess={copySuccess}
            onSavePost={handleSavePost}
            savedPosts={savedPosts}
            onCopyToGoogleDocs={handleCopyToGoogleDocs}
            copyDocsSuccess={copyDocsSuccess}
            onAdjustPost={handleAdjustPost}
            adjustingPostId={adjustingPostId}
          />
          <SavedSection 
            posts={savedPosts}
            onDeletePost={handleDeletePost}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
