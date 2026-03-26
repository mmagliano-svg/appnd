import { notFound } from 'next/navigation'
import { getPublicStory } from '@/actions/stories'
import { StoryPublicClient } from './StoryPublicClient'

export default async function PublicStoryPage({
  params,
}: {
  params: { token: string }
}) {
  const story = await getPublicStory(params.token)
  if (!story) notFound()

  return <StoryPublicClient story={story} />
}
