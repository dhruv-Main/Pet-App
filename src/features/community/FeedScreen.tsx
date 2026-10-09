import React, { useCallback, useState } from 'react';
import { View, FlatList, Pressable, RefreshControl, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Badge, Card, EmptyState, Icon } from '@components/ui';
import { Avatar, RemoteImage } from '@components/media';
import { useTheme } from '@theme/ThemeProvider';
import { useRequireAuth } from '@features/auth/useRequireAuth';
import { useEvents, useFeed } from '@services/data';
import { postAsset } from '@services/media/imageService';
import { formatDay, formatWhen } from '@/demo/demoData';
import type { CommunityEvent, CommunityPost } from '@apptypes/domain';
import type { CommunityStackParamList } from '@navigation/types';

type Nav = NativeStackNavigationProp<CommunityStackParamList, 'Feed'>;

const ACTION_STYLE = { minHeight: 44, minWidth: 44, gap: 4, justifyContent: 'center' as const };

const PostCard = React.memo(function PostCard({
  post,
  onOpen,
}: {
  post: CommunityPost;
  onOpen: (id: string) => void;
}) {
  const { theme } = useTheme();
  const { requireAuth } = useRequireAuth();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post.likes);

  const toggleLike = useCallback(() => {
    requireAuth(() => {
      const next = !liked;
      setLiked(next);
      setLikes((n) => n + (next ? 1 : -1));
    }, 'Sign in to like and join the conversation.');
  }, [liked, requireAuth]);
  const share = useCallback(() => {
    Share.share({ message: `${post.author.name}: ${post.content}` }).catch(() => undefined);
  }, [post]);

  return (
    <Card style={{ gap: 10 }}>
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <Avatar userId={post.author.id} name={post.author.name} size={40} />
        <View className="flex-1">
          <AppText variant="label" numberOfLines={1}>
            {post.author.name}
          </AppText>
          <AppText variant="caption" muted>
            {formatDay(post.createdAt)}
          </AppText>
        </View>
      </View>
      <RemoteImage asset={postAsset(post.id, `Photo shared by ${post.author.name}`)} radius={14} />
      <Pressable
        onPress={() => onOpen(post.id)}
        accessibilityRole="button"
        accessibilityLabel={`Post by ${post.author.name}: ${post.content}`}
        accessibilityHint="Opens the post and comments"
      >
        <AppText variant="body">{post.content}</AppText>
      </Pressable>
      <View className="flex-row items-center" style={{ gap: 12 }}>
        <Pressable
          className="flex-row items-center"
          style={ACTION_STYLE}
          onPress={toggleLike}
          accessibilityRole="button"
          accessibilityLabel={`Like, ${likes} likes`}
          accessibilityState={{ selected: liked }}
        >
          <Icon name="heart" size={20} color={liked ? '#dc2626' : theme.colors.textMuted} />
          <AppText variant="caption" muted>
            {likes}
          </AppText>
        </Pressable>
        <Pressable
          className="flex-row items-center"
          style={ACTION_STYLE}
          onPress={() => onOpen(post.id)}
          accessibilityRole="button"
          accessibilityLabel={`Comments, ${post.comments}`}
        >
          <Icon name="message" size={20} color={theme.colors.textMuted} />
          <AppText variant="caption" muted>
            {post.comments}
          </AppText>
        </Pressable>
        <Pressable
          style={ACTION_STYLE}
          onPress={share}
          accessibilityRole="button"
          accessibilityLabel="Share post"
          className="items-center"
        >
          <Icon name="share" size={20} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </Card>
  );
});

const keyExtractor = (p: CommunityPost) => p.id;

function EventsRail({ events }: { events: CommunityEvent[] }) {
  return (
    <View style={{ gap: 10, paddingBottom: 4 }}>
      <AppText variant="h3" accessibilityRole="header">
        Happening near you
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {events.map((e) => (
          <Card key={e.id} style={{ width: 230, gap: 6 }}>
            <View className="flex-row items-center justify-between">
              <Badge label={e.category.replace('_', ' ')} tone="primary" />
              {e.going && <Badge label="Going" tone="success" />}
            </View>
            <AppText variant="label" numberOfLines={2}>
              {e.title}
            </AppText>
            <AppText variant="caption" muted numberOfLines={1}>
              {e.venue}
            </AppText>
            <AppText variant="caption" muted>
              {formatWhen(e.startsAt)} | {e.attendees} attending
            </AppText>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

export function FeedScreen() {
  const nav = useNavigation<Nav>();
  const { data: feed, refetch } = useFeed();
  const { data: events } = useEvents();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 600);
  }, [refetch]);
  const open = useCallback((postId: string) => nav.navigate('PostDetail', { postId }), [nav]);
  const renderItem = useCallback(
    ({ item }: { item: CommunityPost }) => <PostCard post={item} onOpen={open} />,
    [open],
  );

  return (
    <View className="flex-1 bg-surface-light-2 dark:bg-surface-dark">
      <SafeAreaView edges={['top']} className="px-5 pt-2">
        <AppText variant="h1">Community</AppText>
      </SafeAreaView>
      <FlatList
        data={feed}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 120, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        initialNumToRender={5}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={<EventsRail events={events} />}
        ListEmptyComponent={<EmptyState title="No posts yet" description="Pull down to refresh." />}
      />
    </View>
  );
}
