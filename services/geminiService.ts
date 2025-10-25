
import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratePostsParams, GeneratedPost, ImageTone, AdjustmentParams } from '../types';

const getDifficultyDescription = (level: number): string => {
  switch (level) {
    case 1: return "このトピックに関する事前の知識が全くない完全な初心者";
    case 2: return "このトピックについて基本的な理解がある人々";
    case 3: return "この特定分野の専門家ではないが、一般的に知識のある平均的なビジネスパーソン";
    case 4: return "このトピックにおいて重要な経験と高度な知識を持つ個人";
    case 5: return "この特定分野の第一線の専門家、研究者、または教授";
    default: return "一般的なビジネスオーディエンス";
  }
};

const writingStyleSummary = `
あなたは特定の文体を持つ、日本の著名なビジネス思想家兼ライターです。あなたの名前は「柏木」として振る舞ってください。あなたの文体の核は「実践的フレームワークの探求と共有」です。
あなたの執筆スタイルには以下の特徴があります。

1.  **思考の体系化**: 複雑な事象や思考プロセスを、独自の「型」や「フレームワーク」に落とし込み、構造化・ステップ化して提示します。（例：「思考の流れ:基本の3ステップ」）
2.  **問いから始める**: 常に読者や自身への「問い」から論理を展開し、対話的に思考を促します。（例：「〜となっていませんか？」、「あなたのビジネスの計器はなんですか？」）
3.  **一人称での語り**: 「私が考える」「常々感じていることは」のように、常に「私」を主語とし、自身の経験や内省に基づいた具体性と説得力のある語り口をします。
4.  **対話の呼び水**: あなたの文章は、単体で完結するものではなく、その後のディスカッションや「壁打ち」のきっかけとなることを明確に意図しています。
5.  **比喩の多用**: 抽象的な概念を読者が直感的に理解できるよう、以下のような巧みな比喩を用います。
    *   プロジェクトを「ゲーム」として捉える（例：手持ちのカード、戦略）
    *   組織を「生態系（エコシステム）」として捉える
    *   思考やアイデアを「物理的な構造物」として捉える（例：アイデアを壊す、土台を再検証する）
    *   コンセプトや目標を「旗」として捉える（例：旗を立てる）
    *   不確実な状況を「飛行（フライト）」として捉える（例：計器を見ながら飛行する）
`;

export const generatePosts = async (params: GeneratePostsParams): Promise<GeneratedPost[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEYが設定されていません。");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { topic, minLength, maxLength, difficulty, isThinkingMode, direction } = params;
  const difficultyDescription = getDifficultyDescription(difficulty);

  const directionInstruction = direction && direction.trim() !== ''
    ? `さらに、以下の方向性や指示を考慮して投稿を作成してください：\n「${direction}」\n`
    : '';

  const systemInstruction = `
${writingStyleSummary}

上記のペルソナと文体を厳格に守り、日本のビジネスオーディエンス（20代から50代）からのエンゲージメント（いいね、リポスト、コメント）を最大化する、X（旧Twitter）向けの魅力的な投稿を5つ作成してください。

${directionInstruction}

あなたのトーンは洞察に富み、プロフェッショナルでありながら、堅苦しすぎず親しみやすいものであるべきです。コンテンツは共感を呼ぶか、示唆に富むもので、人々に理解されたと感じさせたり、何か新しいことを学んだりさせるものでなければなりません。

各投稿について、以下のルールを厳守してください：
1.  投稿の文字数は、厳密に${minLength}文字から${maxLength}文字の間でなければなりません。
2.  コンテンツの難易度と専門用語は、次のオーディエンスに合わせて調整してください：${difficultyDescription}。
3.  関連性が高く人気のある日本のハッシュタグを3〜5個、投稿の文中または末尾に含めてください。
4.  モバイルデバイスで読みやすいように、改行を入れて投稿を適切に構成してください。
5.  絵文字は一切使用しないでください。

ユーザーのテーマに基づいて、厳密に5つの異なる投稿バリエーションを生成してください。
  `;

  const modelConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          post: {
            type: Type.STRING,
            description: `A X post body between ${minLength} and ${maxLength} characters, written in the persona of 'Kashiwagi'. It must include hashtags but NO emojis.`,
          },
          intent: {
            type: Type.STRING,
            description: "この投稿の狙い、ターゲット層、エンゲージメントのフック（日本語）",
          },
        },
        required: ["post", "intent"],
      },
    },
    ...(isThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } }),
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `テーマ: "${topic}"`,
      config: {
        systemInstruction,
        ...modelConfig
      }
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (!Array.isArray(parsedResponse) || parsedResponse.length === 0) {
      throw new Error("APIから無効または空のレスポンスが返されました。");
    }

    return parsedResponse as GeneratedPost[];
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("投稿の生成に失敗しました。詳細はコンソールを確認してください。");
  }
};

export const adjustPost = async (originalPost: GeneratedPost, params: AdjustmentParams): Promise<GeneratedPost> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEYが設定されていません。");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { length, difficulty, instruction } = params;
  
  let adjustmentInstruction = "以下の指示に従って、投稿を修正してください。\n";
  if (length === 'shorter') adjustmentInstruction += "- 投稿をより簡潔に、短くしてください。\n";
  if (length === 'longer') adjustmentInstruction += "- 投稿をより詳細に、長くしてください。\n";
  if (difficulty === 'simpler') adjustmentInstruction += "- 専門用語を減らし、より平易な言葉で説明してください。\n";
  if (difficulty === 'more_expert') adjustmentInstruction += "- より専門的な洞察や専門用語を取り入れてください。\n";
  if (instruction && instruction.trim() !== '') adjustmentInstruction += `- 追加の指示： ${instruction}\n`;


  const systemInstruction = `
${writingStyleSummary}

あなたは上記のペルソナと文体を厳格に守り、既存のX（旧Twitter）投稿を修正するタスクを担っています。

元の投稿：
「${originalPost.post}」

元の投稿の意図：
「${originalPost.intent}」

${adjustmentInstruction}

修正後の投稿と、新しい意図を生成してください。
絵文字は一切使用しないでください。
`;

  const modelConfig = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        post: {
          type: Type.STRING,
          description: `The revised X post body, written in the persona of 'Kashiwagi'. It must include hashtags but NO emojis.`,
        },
        intent: {
          type: Type.STRING,
          description: "この修正された投稿の狙い、ターゲット層、エンゲージメントのフック（日本語）",
        },
      },
      required: ["post", "intent"],
    },
    thinkingConfig: { thinkingBudget: 32768 },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: "投稿を修正してください。",
      config: {
        systemInstruction,
        ...modelConfig
      }
    });
    
    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (typeof parsedResponse !== 'object' || parsedResponse === null || !parsedResponse.post || !parsedResponse.intent) {
      throw new Error("APIから無効なレスポンスが返されました。");
    }

    return parsedResponse as GeneratedPost;
  } catch (error) {
    console.error("Gemini API call failed during post adjustment:", error);
    throw new Error("投稿の調整に失敗しました。詳細はコンソールを確認してください。");
  }
};

export const generateImage = async (postContent: string, tone: ImageTone): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEYが設定されていません。");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let toneInstruction = "";
  switch (tone) {
    case 'line-art':
      toneInstruction = "Create a minimalist and sophisticated line art image on a clean white background. Use a single, elegant PANTONE accent color. Any text included must be in English. The overall feel should be modern and professional.";
      break;
    case 'watercolor':
      toneInstruction = "Create a gentle and light watercolor painting. The style should be soft, with subtle color blending, evoking a calm and thoughtful mood. If any text is included, it must be in English.";
      break;
    case 'creative':
      toneInstruction = "Creatively and abstractly interpret the theme. Generate a visually stunning and unique image that is thought-provoking and artistic. Feel free to use any style that best represents the core concept. If any text is included, it must be in English.";
      break;
  }

  const prompt = `
Generate a cover image for a Japanese 'note' article (1280x670px). The image must be visually compelling and directly inspired by the following text content.

**Image Style:** ${toneInstruction}

**Text Content to Inspire Image:**
"${postContent}"

Do not include any of the original Japanese text from the 'Text Content to Inspire Image' in the image. The image should be a metaphorical or direct representation of the core idea in the text.
  `;

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9', // Closest standard to 1280x670
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Image generation failed:", error);
    throw new Error("画像の生成に失敗しました。");
  }
};
