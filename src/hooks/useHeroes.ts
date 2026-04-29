// src/hooks/useHeroes.ts
import { useQuery } from "@tanstack/react-query";
import axiosPublic from "./axiosPublic";

export interface Hero {
  _id: string;
  title: string;
  uniqueID: string;
  imageUrl: string;
  imagePublicId: string;
  createdAt: string;
  updatedAt: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  tag?: string;
}

interface HeroesResponse {
  success: boolean;
  count: number;
  data: Hero[];
}

export const useHeroes = () => {
  return useQuery<Hero[]>({
    queryKey: ["heroes"],
    queryFn: async () => {
      const response = await axiosPublic.get<HeroesResponse>("/api/heroes");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000, // v5 হলে
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
