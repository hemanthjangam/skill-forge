import api from './axios'
import type { PagedResponse } from './courseApi'

export interface NotificationItem {
  id: number
  message: string
  read: boolean
  createdAt: string
}

export const notificationApi = {
  getNotifications: async (page = 0, size = 12): Promise<PagedResponse<NotificationItem>> => {
    const response = await api.get('/notifications', { params: { page, size } })
    return response.data
  },

  markAsRead: async (notificationId: number): Promise<NotificationItem> => {
    const response = await api.patch(`/notifications/${notificationId}/read`)
    return response.data
  },
}
