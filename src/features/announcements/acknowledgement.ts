import type { Notice } from '@/lib/api/types'
import { apiClient } from '@/lib/api/client'

export async function acknowledgeNotice(notice: Notice) {
  const response = await apiClient.post('/api/v1/user/notice/acknowledge', {
    id: notice.id,
    revision: notice.revision ?? notice.updated_at ?? notice.created_at ?? 0,
  })
  if (response.data?.data !== true) throw new Error('确认未保存，请重试。')
}
