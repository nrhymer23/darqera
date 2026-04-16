import { TwitterApi } from "twitter-api-v2";

export async function postTweet(
  title: string,
  slug: string,
  excerpt: string
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return {
      success: false,
      error: "Twitter API keys not configured.",
    };
  }

  const client = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });

  const rwClient = client.readWrite;

  try {
    const postUrl = `https://darqera.com/posts/${slug}`;
    const status = `${title}\n\n${excerpt}\n\nRead more: ${postUrl}`;
    
    // Fallback if status length > 280
    const finalStatus =
      status.length > 280
        ? `${title}\n\nRead more: ${postUrl}`
        : status;

    const tweet = await rwClient.v2.tweet(finalStatus);

    return {
      success: true,
      tweetId: tweet.data.id,
    };
  } catch (error: any) {
    console.error("Failed to post tweet:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
