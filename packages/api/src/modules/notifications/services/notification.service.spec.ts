import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType, UserRole } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      const dto = {
        userId: 'user-1',
        type: NotificationType.POINTS_EARNED,
        title: 'Test Notification',
        body: 'Test Body',
        data: { points: 10 },
      };

      const mockNotification = {
        id: 'notif-1',
        ...dto,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(dto);

      expect(result).toEqual({
        id: 'notif-1',
        userId: 'user-1',
        type: NotificationType.POINTS_EARNED,
        title: 'Test Notification',
        body: 'Test Body',
        data: { points: 10 },
        isRead: false,
        readAt: null,
        createdAt: mockNotification.createdAt,
      });
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: NotificationType.POINTS_EARNED,
          title: 'Test Notification',
          body: 'Test Body',
          data: { points: 10 },
        },
      });
    });
  });

  describe('broadcast', () => {
    it('should broadcast notifications to users with specific roles', async () => {
      const dto = {
        type: NotificationType.SYSTEM,
        title: 'System Announcement',
        body: 'Important update',
        targetRoles: [UserRole.USER],
      };

      const mockUsers = [{ id: 'user-1' }, { id: 'user-2' }, { id: 'user-3' }];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.notification.createMany.mockResolvedValue({
        count: 3,
      });

      const result = await service.broadcast(dto);

      expect(result).toBe(3);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          role: { in: [UserRole.USER] },
        },
        select: { id: true },
      });
      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'user-1',
            type: NotificationType.SYSTEM,
            title: 'System Announcement',
            body: 'Important update',
            data: {},
          },
          {
            userId: 'user-2',
            type: NotificationType.SYSTEM,
            title: 'System Announcement',
            body: 'Important update',
            data: {},
          },
          {
            userId: 'user-3',
            type: NotificationType.SYSTEM,
            title: 'System Announcement',
            body: 'Important update',
            data: {},
          },
        ],
      });
    });

    it('should return 0 when no users match the criteria', async () => {
      const dto = {
        type: NotificationType.SYSTEM,
        title: 'System Announcement',
        body: 'Important update',
        targetRoles: [UserRole.ADMIN],
      };

      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.broadcast(dto);

      expect(result).toBe(0);
      expect(mockPrismaService.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('getForUser', () => {
    it('should get paginated notifications for a user', async () => {
      const userId = 'user-1';
      const dto = { page: 1, limit: 10 };

      const mockNotifications = [
        {
          id: 'notif-1',
          userId,
          type: NotificationType.POINTS_EARNED,
          title: 'Points Earned',
          body: 'You earned 10 points',
          data: {},
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );
      mockPrismaService.notification.count.mockResolvedValue(1);

      const result = await service.getForUser(userId, dto);

      expect(result.notifications).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter unread notifications when unreadOnly is true', async () => {
      const userId = 'user-1';
      const dto = { page: 1, limit: 10, unreadOnly: true };

      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(0);

      await service.getForUser(userId, dto);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notificationId = 'notif-1';
      const userId = 'user-1';

      const mockNotification = {
        id: notificationId,
        userId,
        type: NotificationType.POINTS_EARNED,
        title: 'Test',
        body: 'Test',
        data: {},
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };

      const updatedNotification = {
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      };

      mockPrismaService.notification.findFirst.mockResolvedValue(
        mockNotification,
      );
      mockPrismaService.notification.update.mockResolvedValue(
        updatedNotification,
      );

      const result = await service.markAsRead(notificationId, userId);

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const userId = 'user-1';

      mockPrismaService.notification.updateMany.mockResolvedValue({
        count: 5,
      });

      const result = await service.markAllAsRead(userId);

      expect(result).toBe(5);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('getStats', () => {
    it('should return notification statistics', async () => {
      const userId = 'user-1';

      mockPrismaService.notification.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3); // unread

      const result = await service.getStats(userId);

      expect(result).toEqual({
        total: 10,
        unread: 3,
      });
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      const notificationId = 'notif-1';
      const userId = 'user-1';

      const mockNotification = {
        id: notificationId,
        userId,
        type: NotificationType.POINTS_EARNED,
        title: 'Test',
        body: 'Test',
        data: {},
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };

      mockPrismaService.notification.findFirst.mockResolvedValue(
        mockNotification,
      );
      mockPrismaService.notification.delete.mockResolvedValue(mockNotification);

      await service.delete(notificationId, userId);

      expect(mockPrismaService.notification.delete).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
    });

    it('should throw NotFoundException when notification not found', async () => {
      mockPrismaService.notification.findFirst.mockResolvedValue(null);

      await expect(service.delete('notif-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('helper methods', () => {
    it('should create subscription expiry notification', async () => {
      const userId = 'user-1';
      const businessName = 'Test Business';
      const expiryDate = new Date('2024-12-31');

      const mockNotification = {
        id: 'notif-1',
        userId,
        type: NotificationType.SUBSCRIPTION_EXPIRY,
        title: 'انتهاء صلاحية الاشتراك',
        body: expect.any(String),
        data: {
          businessName,
          expiryDate: expiryDate.toISOString(),
        },
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.notifySubscriptionExpiry(
        userId,
        businessName,
        expiryDate,
      );

      expect(result.type).toBe(NotificationType.SUBSCRIPTION_EXPIRY);
      expect(result.data).toEqual({
        businessName,
        expiryDate: expiryDate.toISOString(),
      });
    });

    it('should create points earned notification', async () => {
      const userId = 'user-1';
      const points = 10;
      const action = 'تقييم نشاط';

      const mockNotification = {
        id: 'notif-1',
        userId,
        type: NotificationType.POINTS_EARNED,
        title: 'حصلت على نقاط',
        body: `حصلت على ${points} نقطة من ${action}`,
        data: { points, action },
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.notifyPointsEarned(userId, points, action);

      expect(result.type).toBe(NotificationType.POINTS_EARNED);
      expect(result.data).toEqual({ points, action });
    });
  });
});
