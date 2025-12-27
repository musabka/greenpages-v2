'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';

interface District {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

interface City {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  districts?: District[];
}

interface Governorate {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  cities?: City[];
}

export default function HierarchyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGovernorates, setExpandedGovernorates] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadHierarchy();
  }, [router]);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const govData = await apiClient.get<Governorate[]>('/geo/governorates?locale=ar');
      
      // Load cities for each governorate
      const governoratesWithCities = await Promise.all(
        govData.map(async (gov) => {
          try {
            const cityData = await apiClient.get<City[]>(
              `/geo/cities?locale=ar&governorateId=${gov.id}`
            );
            return { ...gov, cities: cityData };
          } catch (error) {
            console.error(`Failed to load cities for ${gov.name}:`, error);
            return { ...gov, cities: [] };
          }
        })
      );

      setGovernorates(governoratesWithCities);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDistricts = async (cityId: string) => {
    try {
      const districts = await apiClient.get<District[]>(
        `/geo/districts?locale=ar&cityId=${cityId}`
      );
      
      setGovernorates((prev) =>
        prev.map((gov) => ({
          ...gov,
          cities: gov.cities?.map((city) =>
            city.id === cityId ? { ...city, districts } : city
          ),
        }))
      );
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const toggleGovernorate = (govId: string) => {
    const newExpanded = new Set(expandedGovernorates);
    if (newExpanded.has(govId)) {
      newExpanded.delete(govId);
    } else {
      newExpanded.add(govId);
    }
    setExpandedGovernorates(newExpanded);
  };

  const toggleCity = async (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
      // Load districts if not already loaded
      const city = governorates
        .flatMap((g) => g.cities || [])
        .find((c) => c.id === cityId);
      if (city && !city.districts) {
        await loadDistricts(cityId);
      }
    }
    setExpandedCities(newExpanded);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AdminLayout user={user}>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">جاري تحميل التسلسل الجغرافي...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">التسلسل الجغرافي</h1>
          <p className="text-muted-foreground">
            عرض شجري للمحافظات والمدن والأحياء
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              الهيكل الجغرافي الكامل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {governorates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد بيانات جغرافية
                </p>
              ) : (
                governorates.map((gov) => (
                  <div key={gov.id} className="border rounded-lg">
                    {/* Governorate */}
                    <div
                      className="flex items-center gap-2 p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleGovernorate(gov.id)}
                    >
                      {expandedGovernorates.has(gov.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <span className="font-medium">{gov.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({gov.cities?.length || 0} مدينة)
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          gov.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {gov.isActive ? 'نشط' : 'غير نشط'}
                      </span>
                    </div>

                    {/* Cities */}
                    {expandedGovernorates.has(gov.id) && gov.cities && (
                      <div className="border-t bg-muted/20">
                        {gov.cities.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-3 pr-10">
                            لا توجد مدن
                          </p>
                        ) : (
                          gov.cities.map((city) => (
                            <div key={city.id} className="border-b last:border-0">
                              <div
                                className="flex items-center gap-2 p-3 pr-10 hover:bg-muted/50 cursor-pointer"
                                onClick={() => toggleCity(city.id)}
                              >
                                {expandedCities.has(city.id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div className="flex-1">
                                  <span className="text-sm font-medium">
                                    {city.name}
                                  </span>
                                  {city.districts && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({city.districts.length} حي)
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    city.isActive
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {city.isActive ? 'نشط' : 'غير نشط'}
                                </span>
                              </div>

                              {/* Districts */}
                              {expandedCities.has(city.id) && (
                                <div className="bg-muted/30">
                                  {!city.districts ? (
                                    <p className="text-sm text-muted-foreground p-3 pr-16">
                                      جاري التحميل...
                                    </p>
                                  ) : city.districts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-3 pr-16">
                                      لا توجد أحياء
                                    </p>
                                  ) : (
                                    city.districts.map((district) => (
                                      <div
                                        key={district.id}
                                        className="flex items-center gap-2 p-2 pr-16 border-b last:border-0"
                                      >
                                        <div className="flex-1">
                                          <span className="text-sm">
                                            {district.name}
                                          </span>
                                        </div>
                                        <span
                                          className={`text-xs px-2 py-1 rounded-full ${
                                            district.isActive
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-gray-100 text-gray-700'
                                          }`}
                                        >
                                          {district.isActive ? 'نشط' : 'غير نشط'}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
