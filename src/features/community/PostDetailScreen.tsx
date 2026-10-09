import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AppText, Card, EmptyState, Icon, Input } from '@components/ui';
import { Avatar, RemoteImage } from '@components/media';
import { ScreenHeader } from '@components/platform';
import { useComments, useCurrentUser, usePost } from '@services/data';
import { postAsset } from '@services/media/imageService';
import { formatDay } from '@/demo/demoData';
import { useRequireAuth } from '@features/auth/useRequireAuth';
import type { PostComment } from '@apptypes/domain';
import type { CommunityStackParamList } from '@navigation/types';

export function PostDetailScreen() {
  const route = useRoute<RouteProp<CommunityStackParamList, 'PostDetail'>>();
  const nav = useNavigation();
  const post = usePost(route.params?.postId).data;
  const stored = useComments(route.params?.postId).data;
  const me = useCurrentUser();
  const { requireAuth } = useRequireAuth();
  const [draft, setDraft] = useState('');
  const [added, setAdded] = useState<PostComment[]>([]);
  const comments = [...stored, ...added];

  const send = () => requireAuth(doSend, 'Sign in to comment and join the conversation.');
  const doSend = () => {
    const text = draft.trim();
    if (!text || !post) return;
    setAdded((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, postId: post.id, author: { id: me.id, name: me.name }, content: text, likes: 0, createdAt: new Date().toISOString() },
    ]);
    setDraft('');
  };

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <ScreenHeader title="Post" onBack={() => nav.goBack()} />
      {!post ? (
        <EmptyState
          title="Post not found"
          description="It may have been removed."
          actionLabel="Go back"
          onAction={() => nav.goBack()}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
            <Card style={{ gap: 10 }}>
              <View className="flex-row items-center" style={{ gap: 10 }}>
                <Avatar userId={post.author.id} name={post.author.name} size={40} />
                <AppText variant="label">{post.author.name}</AppText>
              </View>
              <RemoteImage asset={postAsset(post.id, `Photo shared by ${post.author.name}`)} radius={14} />
              <AppText variant="body">{post.content}</AppText>
              <AppText variant="caption" muted>
                {post.likes} likes | {comments.length} comments
              </AppText>
            </Card>
            <AppText variant="h3" className="pt-2" accessibilityRole="header">
              Comments
            </AppText>
            {comments.map((c) => (
              <Card key={c.id} variant="outline" style={{ gap: 6 }}>
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Avatar userId={c.author.id} name={c.author.name} size={28} />
                  <AppText variant="label" style={{ flex: 1 }} numberOfLines={1}>
                    {c.author.name}
                  </AppText>
                  <AppText variant="caption" muted>
                    {formatDay(c.createdAt)}
                  </AppText>
                </View>
                <AppText muted>{c.content}</AppText>
              </Card>
            ))}
          </ScrollView>
          <SafeAreaView edges={['bottom']} className="border-t border-neutral-200 p-3 dark:border-white/10">
            <Input
              label="Add a comment"
              placeholder="Add a comment"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={send}
              returnKeyType="send"
              rightIcon={<Icon name="send" size={18} color="#1865f5" />}
              onPressRightIcon={send}
              rightIconLabel="Send comment"
            />
          </SafeAreaView>
        </>
      )}
    </View>
  );
}
