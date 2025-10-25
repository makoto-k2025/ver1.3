
import React from 'react';
import type { Difficulty } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { Slider } from './ui/Slider';

interface InputSectionProps {
  topic: string;
  setTopic: (value: string) => void;
  direction: string;
  setDirection: (value: string) => void;
  charCount: { min: number; max: number };
  setCharCount: (value: { min: number; max: number }) => void;
  difficulty: Difficulty;
  setDifficulty: (value: Difficulty) => void;
  isThinkingMode: boolean;
  setIsThinkingMode: (value: boolean) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  topic,
  setTopic,
  direction,
  setDirection,
  charCount,
  setCharCount,
  difficulty,
  setDifficulty,
  isThinkingMode,
  setIsThinkingMode,
  onGenerate,
  isLoading,
}) => {
  const difficultyLabels: { [key in Difficulty]: string } = {
    1: '初心者',
    2: '中級者',
    3: 'ビジネス',
    4: '上級者',
    5: '専門家',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
      <div>
        <label htmlFor="topic" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
          1. トピックや内容を入力
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="例：プロジェクトマネジメント、AI時代のリーダーシップ、持続可能なビジネスモデル..."
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      <div>
        <label htmlFor="direction" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
          2. テーマや方向性を入力 (任意)
        </label>
        <textarea
          id="direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          placeholder="例：ビジネスパーソン向けに、専門用語を多めに。DXの文脈で解説してほしい。"
          className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
            3. 文字数を設定
          </label>
           <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setCharCount({ min: 300, max: 600 })} className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition shadow-sm">Xモード</button>
            <button onClick={() => setCharCount({ min: 1500, max: 5000 })} className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition shadow-sm">noteモード</button>
          </div>
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <label htmlFor="min-chars" className="block text-sm font-medium text-gray-600 dark:text-gray-300">最小</label>
              <input
                id="min-chars"
                type="number"
                value={charCount.min}
                onChange={(e) => setCharCount({ ...charCount, min: parseInt(e.target.value, 10) || 0 })}
                className="w-full mt-1 p-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                step={10}
                min={50}
                max={4990}
              />
            </div>
             <span className="pb-2 text-gray-500 dark:text-gray-400">〜</span>
            <div className="flex-1">
              <label htmlFor="max-chars" className="block text-sm font-medium text-gray-600 dark:text-gray-300">最大</label>
              <input
                id="max-chars"
                type="number"
                value={charCount.max}
                onChange={(e) => setCharCount({ ...charCount, max: parseInt(e.target.value, 10) || 0 })}
                className="w-full mt-1 p-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                step={10}
                min={100}
                max={5000}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
            4. 投稿の難易度を設定
          </label>
          <Slider
            label={difficultyLabels[difficulty]}
            value={difficulty}
            min={1}
            max={5}
            step={1}
            onChange={(val) => setDifficulty(val as Difficulty)}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
         <div className="flex items-center">
            <input
              id="thinking-mode"
              type="checkbox"
              checked={isThinkingMode}
              onChange={(e) => setIsThinkingMode(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="thinking-mode" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              思考モードを有効にする（複雑なクエリ向け）
            </label>
          </div>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          {isLoading ? <SpinnerIcon /> : '投稿を生成'}
        </button>
      </div>

    </div>
  );
};
