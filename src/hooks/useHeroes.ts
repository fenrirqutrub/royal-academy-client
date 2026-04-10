// src/hooks/useHeroes.ts
import { useQuery } from "@tanstack/react-query";
import axiosPublic from "./axiosPublic";

interface Hero {
  _id: string;
  title: string;
  uniqueID: string;
  imageUrl: string;
  imagePublicId: string;
  createdAt: string;
  updatedAt: string;
}

interface HeroesResponse {
  success: boolean;
  count: number;
  data: Hero[];
}

export const useHeroes = () => {
  return useQuery<HeroesResponse>({
    queryKey: ["heroes"],
    queryFn: async () => {
      const response = await axiosPublic.get<HeroesResponse>("/api/heroes");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};
