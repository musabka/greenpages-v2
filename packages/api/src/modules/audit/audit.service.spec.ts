import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create audit log entry', async () => {
      const auditData = {
        userId: 'user-1',
        action: 'CREATE',
        entityType: 'Business',
        entityId: 'business-1',
        newValue: { name: 'Test Business' },
      };

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'log-1',
        ...auditData,
        createdAt: new Date(),
      });

      await service.log(auditData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          action: 'CREATE',
          entityType: 'Business',
          entityId: 'business-1',
        }),
      });
    });

    it('should handle optional fields', async () => {
      const auditData = {
        userId: 'user-1',
        action: 'UPDATE',
        entityType: 'Business',
        entityId: 'business-1',
        oldValue: { name: 'Old Name' },
        newValue: { name: 'New Name' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      mockPrismaService.auditLog.create.mockResolvedValue({
        id: 'log-1',
        ...auditData,
        createdAt: new Date(),
      });

      await service.log(auditData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });
  });

  describe('getByUser', () => {
    it('should return audit logs for specific user', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'CREATE',
          entityType: 'Business',
          entityId: 'business-1',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getByUser('user-1');

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should respect custom limit', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      await service.getByUser('user-1', 100);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });

  describe('getByEntity', () => {
    it('should return audit logs for specific entity', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'UPDATE',
          entityType: 'Business',
          entityId: 'business-1',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getByEntity('Business', 'business-1');

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { entityType: 'Business', entityId: 'business-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('getRecent', () => {
    it('should return recent audit logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          userId: 'user-1',
          action: 'CREATE',
          entityType: 'Business',
          entityId: 'business-1',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRecent();

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });
});
