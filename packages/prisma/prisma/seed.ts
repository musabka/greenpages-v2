import { PrismaClient, UserRole, RewardAction, AppTarget, BlockType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@greenpages.com' },
    update: {},
    create: {
      email: 'admin@greenpages.com',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      locale: 'ar',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create default plan
  const defaultPlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    update: {},
    create: {
      slug: 'free',
      price: 0,
      durationDays: 365,
      isDefault: true,
      isActive: true,
      sortOrder: 0,
      translations: {
        create: [
          { locale: 'ar', name: 'مجاني', description: 'الباقة المجانية الأساسية' },
          { locale: 'en', name: 'Free', description: 'Basic free plan' },
        ],
      },
      features: {
        create: [
          { featureKey: 'max_images', featureValue: '3' },
          { featureKey: 'show_whatsapp', featureValue: 'false' },
          { featureKey: 'show_working_hours', featureValue: 'false' },
          { featureKey: 'map_pin_visible', featureValue: 'true' },
          { featureKey: 'search_priority', featureValue: '0' },
          { featureKey: 'profile_highlight', featureValue: 'false' },
        ],
      },
    },
  });
  console.log('✅ Default plan created:', defaultPlan.slug);

  // Create reward configurations
  const rewardConfigs = [
    { action: RewardAction.SUBMIT_REVIEW, points: 10, description: 'نقاط لإضافة مراجعة' },
    { action: RewardAction.REPORT_WRONG_PHONE, points: 5, description: 'نقاط للإبلاغ عن رقم خاطئ' },
    { action: RewardAction.REPORT_CLOSED_BUSINESS, points: 5, description: 'نقاط للإبلاغ عن نشاط مغلق' },
    { action: RewardAction.FIRST_REVIEW_OF_DAY, points: 5, description: 'نقاط إضافية لأول مراجعة في اليوم' },
    { action: RewardAction.VERIFIED_REPORT, points: 15, description: 'نقاط للبلاغ المؤكد' },
  ];

  for (const config of rewardConfigs) {
    await prisma.rewardConfig.upsert({
      where: { action: config.action },
      update: { points: config.points },
      create: config,
    });
  }
  console.log('✅ Reward configurations created');

  // Create feature toggles
  const featureToggles = [
    { key: 'show_whatsapp', value: true, description: 'عرض رقم الواتساب', target: AppTarget.ALL },
    { key: 'show_working_hours', value: true, description: 'عرض ساعات العمل', target: AppTarget.ALL },
    { key: 'visitor_submission', value: false, description: 'السماح للزوار بإضافة أنشطة', target: AppTarget.WEB_DIRECTORY },
    { key: 'ads_search_sponsored', value: true, description: 'إعلانات نتائج البحث', target: AppTarget.ALL },
    { key: 'ads_home_hero', value: true, description: 'إعلانات الصفحة الرئيسية', target: AppTarget.WEB_DIRECTORY },
    { key: 'ads_category_banner', value: true, description: 'إعلانات صفحات التصنيفات', target: AppTarget.ALL },
  ];

  for (const toggle of featureToggles) {
    await prisma.featureToggle.upsert({
      where: { key: toggle.key },
      update: { value: toggle.value },
      create: toggle,
    });
  }
  console.log('✅ Feature toggles created');

  // Create default blocks
  const blocks = [
    {
      type: BlockType.HEADER,
      target: AppTarget.WEB_DIRECTORY,
      settingsJson: { logo: '/logo.png', showSearch: true, showLanguageSwitcher: true },
    },
    {
      type: BlockType.FOOTER,
      target: AppTarget.WEB_DIRECTORY,
      settingsJson: { showSocialLinks: true, showContactInfo: true },
    },
    {
      type: BlockType.HOME_HERO,
      target: AppTarget.WEB_DIRECTORY,
      settingsJson: { title: 'الصفحات الخضراء', subtitle: 'دليلك الموثوق للأنشطة التجارية', showSearch: true },
    },
  ];

  for (const block of blocks) {
    await prisma.block.upsert({
      where: { type_target: { type: block.type, target: block.target } },
      update: { settingsJson: block.settingsJson },
      create: block,
    });
  }
  console.log('✅ Default blocks created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
