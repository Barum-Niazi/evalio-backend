export function filterAndFormatFeedbacks(feedbacks: any[], currentUser: any) {
  return feedbacks
    .filter((fb) => {
      const visibility = fb.visibility?.code;

      if (!visibility) return false;

      switch (visibility) {
        case 'PUBLIC':
          return true;

        case 'PRIVATE':
        case 'ANONYMOUS':
          return (
            fb.sender_id === currentUser.id || fb.receiver_id === currentUser.id
          );

        case 'COMPANY_ONLY':
          return (
            fb.receiver?.company_id &&
            fb.receiver.company_id === currentUser.company_id
          );

        default:
          return false;
      }
    })
    .map((fb) => {
      const isAnonymous = fb.visibility?.code === 'ANONYMOUS';

      return {
        ...fb,
        visibilityType: fb.visibility?.code,
        sender: isAnonymous ? null : fb.sender,
      };
    });
}

export function transformFeedback(feedback: any, currentUserId: number): any {
  const isAnonymous = feedback.visibility?.code === 'ANONYMOUS';
  const senderName = isAnonymous ? null : (feedback.sender?.name ?? null);
  const receiverName = feedback.receiver?.name ?? null;

  return {
    id: feedback.id,
    title: feedback.title,
    feedbackText: feedback.feedback_text,
    sentiment: feedback.sentiment,
    isAnonymous: feedback.is_anonymous,
    visibilityType: feedback.visibility?.code,
    sender: senderName,
    senderId: feedback.sender_id,
    receiver: receiverName,
    receiverId: feedback.receiver_id,
    date: feedback.date,
    tags:
      feedback.tags?.map((tag) => {
        const baseTag = {
          name: tag.name,
          description: tag.description,
        };

        if (tag.parent_entity_id && tag.parent_entity_type) {
          return {
            ...baseTag,
            linkedEntity: {
              id: tag.parent_entity_id,
              type: tag.parent_entity_type,
            },
          };
        }

        return baseTag;
      }) ?? [],
  };
}
