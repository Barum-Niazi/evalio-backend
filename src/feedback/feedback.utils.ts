export function filterAndFormatFeedbacks(
  feedbacks: any[],
  currentUser: { id: number; companyId: number },
) {
  return feedbacks
    .filter((fb) => {
      const visibility = fb.visibility?.code;
      const isRecipient = fb.receiver_id === currentUser.id;
      const isSender = fb.sender_id === currentUser.id;
      const isManager = fb.receiver?.manager_id === currentUser.id;
      const sameCompany = fb.receiver?.company_id === currentUser.companyId;

      // Always show feedback sent by the user, regardless of visibility
      if (isSender) return true;

      switch (visibility) {
        case 'PUBLIC':
          return sameCompany;

        case 'MANAGER_ONLY':
          return isManager;

        case 'MANAGER_PRIVATE':
          return isManager || isRecipient;

        case 'ANONYMOUS':
          return isRecipient;

        case 'PRIVATE':
          return isRecipient;

        default:
          return false;
      }
    })
    .map((fb) => {
      const isAnonymous = fb.visibility?.code === 'ANONYMOUS';
      const isSender = fb.sender_id === currentUser.id;

      return {
        ...fb,
        visibilityType: fb.visibility?.code,
        sender: isAnonymous && !isSender ? null : fb.sender,
        senderId: isAnonymous && !isSender ? null : fb.sender_id,
      };
    });
}

export function transformFeedback(
  feedback: any,
  currentUserId: number,
  images?: {
    senderProfileImage?: any;
    receiverProfileImage?: any;
  },
): any {
  const isAnonymous = feedback.visibility?.code === 'ANONYMOUS';
  const isSender = feedback.sender_id === currentUserId;

  return {
    id: feedback.id,
    title: feedback.title,
    feedbackText: feedback.feedback_text,
    sentiment: feedback.sentiment,
    isAnonymous: feedback.is_anonymous,
    visibilityType: feedback.visibility?.code,

    sender: isAnonymous && !isSender ? null : (feedback.sender?.name ?? null),
    senderId: isAnonymous && !isSender ? null : feedback.sender_id,
    senderProfileImage:
      isAnonymous && !isSender ? null : (images?.senderProfileImage ?? null),

    receiver: feedback.receiver?.name ?? null,
    receiverId: feedback.receiver_id,
    receiverProfileImage: images?.receiverProfileImage ?? null,

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
