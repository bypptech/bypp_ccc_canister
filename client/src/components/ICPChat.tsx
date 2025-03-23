import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { ScrollArea } from "./ui/scroll-area";
import { apiRequest } from '../lib/queryClient';

interface Message {
  role: {
    user?: null;
    system?: null;
  };
  content: string;
  isUser?: boolean;
  blockData?: BlockchainData;
}

interface BlockchainData {
  blockNumber: string;
  blockInfo: any;
  timestamp: string;
}

interface ICPChatProps {
  principalId: string;
}

const ICPChat = ({ principalId }: ICPChatProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>("EVM Block Explorer");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        role: { system: null },
        content: `こんにちは！ 操作語を入力して下さい`
      }
    ]);
  }, [principalId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleFeatureChange = (feature: string) => {
    setSelectedFeature(feature);
    setMessages([
      {
        role: { system: null },
        content: `こんにちは！ 操作語を入力して下さい`
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: { user: null },
      content: input,
      isUser: true,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const thinkingMessage: Message = {
      role: { system: null },
      content: '考え中...',
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      if (selectedFeature === "ICP価格チェッカー" && !input.startsWith("price")) {
        setMessages(prev => [
          ...prev.slice(0, prev.length - 1),
          {
            role: { system: null },
            content: "現在の機能選択では操作語「price」のみ使用できます",
          },
        ]);
        setIsLoading(false);
        return;
      }

      if (selectedFeature === "EVM Block Explorer" && !input.startsWith("block")) {
        setMessages(prev => [
          ...prev.slice(0, prev.length - 1),
          {
            role: { system: null },
            content: "現在の機能選択では操作語「block」のみ使用できます",
          },
        ]);
        setIsLoading(false);
        return;
      }

      const blockRegex = /block\s*([\+\-]?)\s*(\d+)/i;
      const match = input.match(blockRegex);

      if (match) {
        const operator = match[1] || '+';
        const number = match[2];
        const isLatestBlock = (number === '0');
        const command = isLatestBlock ? 'block 0' : `block ${operator}${number}`;
        try {
          const response = await apiRequest({
            method: 'POST',
            url: '/api/chat/blockchain',
            body: { command: command }
          }, { on401: 'throw' });

          const blockchainResponse = response as {
            command: string;
            blockNumber: string;
            blockInfo: any;
            timestamp: string;
          };

          const { blockNumber, blockInfo } = blockchainResponse;

          const txCount = blockInfo?.transactions?.length || 0;

          let blockResponseContent = `ブロック ${blockNumber} の情報:\n`;

          if (blockInfo) {
            blockResponseContent += `・ハッシュ: ${blockInfo?.hash?.substring(0, 12) || 'なし'}...${blockInfo?.hash?.substring(60) || ''}\n`;
            blockResponseContent += `・親ハッシュ: ${blockInfo?.parentHash?.substring(0, 8) || 'なし'}...${blockInfo?.parentHash?.substring(60) || ''}\n`;
            blockResponseContent += `・トランザクション数: ${txCount}\n`;
            blockResponseContent += `・ガス使用量: ${parseInt(blockInfo?.gasUsed || '0', 16)}\n`;
            blockResponseContent += `・ガスリミット: ${parseInt(blockInfo?.gasLimit || '0', 16)}\n`;
          } else {
            blockResponseContent += `ブロック情報を取得できませんでした。`;
          }

          setMessages(prev => [
            ...prev.slice(0, prev.length - 1),
            {
              role: { system: null },
              content: blockResponseContent,
              blockData: {
                blockNumber,
                blockInfo,
                timestamp: blockchainResponse.timestamp
              }
            }
          ]);
        } catch (error) {
          console.error('Block fetch error:', error);
          setMessages(prev => [
            ...prev.slice(0, prev.length - 1),
            {
              role: { system: null },
              content: 'ブロックチェーン情報の取得に失敗しました。もう一度お試しください。'
            }
          ]);
        }
      } else {
        const priceRegex = /price\s+([\w-]+)/i;
        const priceMatch = input.match(priceRegex);

        if (priceMatch) {
          const currency = priceMatch[1].toUpperCase();
          try {
            const response = await apiRequest({
              method: 'GET',
              url: `/api/chat/price?currency=${currency}`,
            }, { on401: 'throw' });

            const priceResponse = response as {
              currency: string;
              price: number;
              timestamp: string;
            };

            const btcResponse = await apiRequest({
              method: 'GET',
              url: `/api/chat/price?currency=bitcoin`,
            }, { on401: 'throw' });

            const ethResponse = await apiRequest({
              method: 'GET',
              url: `/api/chat/price?currency=ethereum`,
            }, { on401: 'throw' });

            const btcPrice = btcResponse.price.toFixed(2);
            const ethPrice = ethResponse.price.toFixed(2);

            const priceResponseContent = `通貨 ${priceResponse.currency} の現在価格:\n` +
              `・価格: ¥${priceResponse.price.toFixed(2)}\n` +
              `・取得時刻: ${new Date(priceResponse.timestamp).toLocaleString('ja-JP')}\n\n` +
              `その他の通貨:\n` +
              `・Bitcoin (BTC): ¥${btcPrice}\n` +
              `・Ethereum (ETH): ¥${ethPrice}`;

            setMessages(prev => [
              ...prev.slice(0, prev.length - 1),
              {
                role: { system: null },
                content: priceResponseContent,
              }
            ]);
          } catch (error) {
            console.error('Price fetch error:', error);
            setMessages(prev => [
              ...prev.slice(0, prev.length - 1),
              {
                role: { system: null },
                content: '価格情報の取得に失敗しました。もう一度お試しください。'
              }
            ]);
          }
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        const responseMessage = `"block 0"（最新ブロック）や"block -1"（1つ前のブロック）など、block情報のみ対応しています。`;

        setMessages(prev => [
          ...prev.slice(0, prev.length - 1),
          {
            role: { system: null },
            content: responseMessage
          }
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev.slice(0, prev.length - 1),
        {
          role: { system: null },
          content: 'すみません、エラーが発生しました。もう一度お試しください。'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="icp-card mb-8">
      <CardHeader className="pb-4">
        <CardTitle className="icp-gradient-text text-2xl">C.C.C.チャット</CardTitle>
        <CardDescription className="text-lg icp-gradient-text">
          シンプルに繋がる、言葉で操作する、あなたのための対話型オペレーター
        </CardDescription>
        <CardDescription className="text-lg font-bold text-white">
          利用する機能をチェックして下さい
        </CardDescription>
        <div className="mt-4 space-y-2">
          <div onClick={() => handleFeatureChange("EVM Block Explorer")}>
            <input
              type="radio"
              id="evm-block-explorer"
              name="feature"
              value="EVM Block Explorer"
              checked={selectedFeature === "EVM Block Explorer"}
              onChange={() => handleFeatureChange("EVM Block Explorer")}
              style={{ accentColor: 'green' }}
            />
            <label htmlFor="evm-block-explorer" className="ml-2">
              EVM Block Explorer
            </label>
            <label
              className="text-xs  ml-2 no-underline">
                Powered by
            </label>
            <a
              href="https://etherscan.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#2196F3] ml-2 no-underline"
            >
              Etherscan.io APIs
            </a>
            <p className="text-s text-[#BBBBBB] ml-5 cursor-pointer">
              EVM ブロック情報を確認
            </p>
            <p className="text-sm text-[#BBBBBB] ml-6 cursor-pointer">
              操作語 例
            </p>
            <ul
              className="text-sm text-[#BBBBBB] ml-6 cursor-pointer list-disc list-inside"
            >
              <li>"block 0" ：最新ブロックを知りたい</li>
              <li>"block -1"：1つ前のブロックを知りたい</li>
            </ul>
          </div>
          <div onClick={() => handleFeatureChange("ICP価格チェッカー")}>
            <input
              type="radio"
              id="icp-price-checker"
              name="feature"
              value="ICP価格チェッカー"
              checked={selectedFeature === "ICP価格チェッカー"}
              onChange={() => handleFeatureChange("ICP価格チェッカー")}
              style={{ accentColor: 'green' }}
            />
            <label htmlFor="icp-price-checker" className="ml-2">
              ICP価格チェッカー
            </label>
            <label
              className="text-xs  ml-2 no-underline">
                Powered by
            </label>
            <a
              href="https://www.coingecko.com/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#2196F3] ml-2 no-underline"
            >
              CoinGecko API
            </a>
            <p className="text-s text-[#BBBBBB] ml-5 cursor-pointer">
              ICPの現在価格を確認
            </p>
            <p className="text-sm text-[#BBBBBB] ml-6 cursor-pointer">
              操作語 例
            </p>
            <ul className="text-sm text-[#BBBBBB] ml-6 cursor-pointer list-disc list-inside" >
              <li>"price ICP"：ICPの価格を知りたい</li>
            </ul>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {selectedFeature ? (
          <div className="p-4 bg-[#222222] text-[#E0E0E0] rounded-md mb-4">
            <p className="text-sm">
              現在選択されている機能: <span className="font-bold">{selectedFeature}</span>
            </p>
          </div>
        ) : (
          <div className="p-4 bg-[#222222] text-[#E0E0E0] rounded-md mb-4">
            <p className="text-sm">機能を選択してください。</p>
          </div>
        )}
        <ScrollArea
          ref={scrollAreaRef}
          className="h-[600px] px-6 py-4 border-y border-[#2196F3]/20 bg-[#222222]"
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] p-3 rounded-lg 
                    ${message.isUser
                      ? 'bg-[#1E88E5] text-white'
                      : 'bg-[#333333] text-[#E0E0E0]'}
                  `}
                >
                  <div className="flex items-center mb-1">
                    {message.isUser ? (
                      <>
                        <span className="font-medium">You</span>
                        <span className="text-xs ml-2 opacity-70">{formatDate(new Date())}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">Assistant</span>
                        <span className="text-xs ml-2 opacity-70">{formatDate(new Date())}</span>
                      </>
                    )}
                  </div>
                  <pre className="japanese-text whitespace-pre-wrap">{message.content}</pre>
                  {message.blockData && (
                    <div className="mt-2 p-2 rounded bg-[#111111] border border-[#2196F3]/30 text-xs">
                      <p className="text-[#64B5F6] mb-1">EVMブロックデータ取得完了</p>
                      <p>ブロック番号: {message.blockData.blockNumber}</p>
                      <p>取得時刻: {new Date(message.blockData.timestamp).toLocaleString('ja-JP')}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <Skeleton className="h-16 w-64" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="メッセージを入力..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            className="flex-grow japanese-text"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="icp-button-primary"
          >
            送信
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ICPChat;
