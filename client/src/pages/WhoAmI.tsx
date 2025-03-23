import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../hooks/use-toast";
import ICPChat from "../components/ICPChat";
import { AuthClient } from '@dfinity/auth-client';

const identityProvider =
  process.env.NODE_ENV === 'production'
    ? 'https://identity.ic0.app' // Mainnet
    : 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943'; // Local

export default function WhoAmI() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authClient = await AuthClient.create();
        const authenticated = await authClient.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal().toText());
        }
      } catch (err) {
        console.error("AuthClient initialization error:", err);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      const authClient = await AuthClient.create();
      await authClient.login({
        identityProvider,
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal().toText());
          setIsAuthenticated(true);
          toast({
            title: "ログイン成功",
            description: "Internet Identityで認証されました。",
          });
        },
        onError: (err) => {
          console.error("Login error:", err);
          toast({
            title: "ログインエラー",
            description: "認証中に問題が発生しました。",
            variant: "destructive",
          });
        },
      });
    } catch (err) {
      console.error("Login process error:", err);
      toast({
        title: "ログインエラー",
        description: "ログイン処理中にエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const authClient = await AuthClient.create();
      await authClient.logout();
      setIsAuthenticated(false);
      setPrincipal(null);
      toast({
        title: "ログアウト",
        description: "正常にログアウトしました。",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getPrincipal = async () => {
    setIsLoading(true);
    try {
      const authClient = await AuthClient.create();
      if (authClient.isAuthenticated()) {
        const identity = authClient.getIdentity();
        setPrincipal(identity.getPrincipal().toText());
      } else {
        throw new Error("ユーザーが認証されていません。");
      }
    } catch (err) {
      console.error("Error getting principal:", err);
      toast({
        title: "エラー",
        description: "Principal IDの取得に失敗しました。",
        variant: "destructive",
      });
      setPrincipal(null);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "コピー完了",
          description: "Principal IDがクリップボードにコピーされました。",
        });
      })
      .catch((err) => {
        toast({
          title: "コピーエラー",
          description: "コピー中にエラーが発生しました。",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl icp-container">
      <div className="flex flex-col items-center mb-8">
        <h1 className="icp-gradient-text text-5xl font-extrabold text-center mb-2">
          Chat. Control. Connect.
        </h1>
        <p className="text-lg text-center text-muted-foreground">
          シンプルに繋がる、言葉で操作する、あなたのための対話型オペレーター

        </p>
      </div>

      <Card className="mb-8 icp-card">
        <CardHeader className="pb-2">
          <CardTitle className="icp-gradient-text text-2xl">Internet Computer Principal ID</CardTitle>
          <CardDescription>
            Principal IDはInternet Computer上でユーザーやサービスを一意に識別する識別子です
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center mb-4 p-2 bg-primary/10 rounded-md">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <p>あなたはInternet Identityで認証されています <span className="icp-status-badge icp-status-badge-success">認証済み</span></p>
              </div>

              <p className="mb-2 font-medium">あなたのPrincipal ID:</p>

              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : principal ? (
                <div
                  className="principal-id group relative"
                  onClick={() => copyToClipboard(principal)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"></div>
                  <pre className="font-mono text-sm">{principal}</pre>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">(クリックしてコピー)</p>
                    <span className="icp-status-badge icp-status-badge-info">Internet Computer ID</span>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-500/10 p-4 rounded-md border border-blue-500/30 text-blue-600">
                  Principal IDを取得できませんでした。ネットワーク接続を確認してください。
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#2A2A2A] p-6 rounded-md text-center border border-[#2196F3]/20">
              <p className="mb-4 text-[#E0E0E0] japanese-text">Internet Identityでログインすると、あなたのPrincipal IDが表示されます。</p>
              <p className="text-sm text-[#BBBBBB] japanese-text">Internet Identityはブロックチェーン上で安全に認証を行うためのサービスです。</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-2 pb-4">
          <div className="flex justify-center w-full">
            {!isAuthenticated ? (
              <Button
                onClick={login}
                disabled={isLoading}
                className="icp-button-primary px-6"
              >
                {isLoading ? "ログイン中..." : "Internet Identityでログイン"}
              </Button>
            ) : (
              <Button variant="outline" onClick={logout} className="icp-button-outline">
                ログアウト
              </Button>
            )}
          </div>

          {!isAuthenticated && (
            <div className="icp-highlight-surface p-4 rounded-md">
              <h3 className="font-medium mb-2 text-[#64B5F6]">Principal IDについて</h3>
              <p className="japanese-text">
                Principal ID は、Internet Computer上でユーザーやキャニスター（スマートコントラクト）を一意に識別するためのIDです。
                あらゆるエンティティ（ユーザー、キャニスター、その他のサービス）はこのIDによって識別されます。
              </p>
            </div>
          )}
        </CardFooter>
      </Card>

      {isAuthenticated && principal ? (
        <ICPChat principalId={principal} />
      ) : (
        <Card className="icp-card mt-8">
          <CardHeader>
            <CardTitle className="icp-gradient-text">C.C.C (Chat. Control. Connect.) とは？</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="japanese-text">
              使い慣れたチャットで、利用する機能を選び操作できます。<br />
              操作は、短かな操作語を入力するだけ　複雑な操作は必要ありません。
            </p>

            <h3 className="font-medium text-[#64B5F6] mt-6 mb-3">C.C.C.が利用する<span className="font-bold">Internet Computer</span> ブロックチェーンプラットフォーム</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="icp-dark-surface p-4 rounded-md hover:bg-[#2A2A2A] transition-colors border border-[#2196F3]/10">
                <h3 className="font-medium mb-2 text-[#64B5F6]">分散型ネットワーク</h3>
                <p className="text-sm icp-muted-text japanese-text">世界中の分散したノードで運用される、信頼性の高いサービスを提供できる</p>
              </div>
              <div className="icp-dark-surface p-4 rounded-md hover:bg-[#2A2A2A] transition-colors border border-[#2196F3]/10">
                <h3 className="font-medium mb-2 text-[#64B5F6]">高速なスマートコントラクト実行スピード</h3>
                <p className="text-sm icp-muted-text japanese-text">スマートコントラクトや分散型アプリケーションを迅速かつ効率的に処理できる</p>
              </div>
              <div className="icp-dark-surface p-4 rounded-md hover:bg-[#2A2A2A] transition-colors border border-[#2196F3]/10">
                <h3 className="font-medium mb-2 text-[#64B5F6]">セキュリティと透明性</h3>
                <p className="text-sm icp-muted-text japanese-text">最新の暗号技術とコンセンサスプロトコルにより、安全で確実に処理できる</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}