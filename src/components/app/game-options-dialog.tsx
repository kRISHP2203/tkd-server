'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

export type GameSettings = {
  roundTime: number;
  totalRounds: number;
  leadPoints: number;
  restTime: number;
  maxGamJeom: number;
};

const settingsSchema = z.object({
  roundTime: z.number().min(10, "Round time must be at least 10 seconds."),
  totalRounds: z.number().min(1, "There must be at least 1 round."),
  leadPoints: z.number().min(1, "Lead points must be at least 1."),
  restTime: z.number().min(10, "Rest time must be at least 10 seconds."),
  maxGamJeom: z.number().min(1, "Max penalties must be at least 1."),
});

interface GameOptionsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    initialSettings: GameSettings;
    onSave: (settings: GameSettings) => void;
}

export default function GameOptionsDialog({ isOpen, onOpenChange, initialSettings, onSave }: GameOptionsDialogProps) {
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GameSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initialSettings,
  });

  useEffect(() => {
    if (isOpen) {
        reset(initialSettings);
    }
  }, [isOpen, initialSettings, reset]);

  const handleSave = (data: GameSettings) => {
    try {
      localStorage.setItem('gameSettings', JSON.stringify(data));
      onSave(data);
      toast({ title: "Settings Saved", description: "Your new match rules have been applied." });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error Saving Settings", description: "Could not save settings to local storage.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Game Options</DialogTitle>
          <DialogDescription>
            Configure the rules for the match. Changes will be saved for future matches.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roundTime" className="text-right">
                Round Time (s)
              </Label>
              <Controller
                name="roundTime"
                control={control}
                render={({ field }) => (
                  <Input
                    id="roundTime"
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                    className="col-span-3"
                  />
                )}
              />
              {errors.roundTime && <p className="col-span-4 text-destructive text-sm text-right">{errors.roundTime.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalRounds" className="text-right">
                Number of Rounds
              </Label>
              <Controller
                name="totalRounds"
                control={control}
                render={({ field }) => (
                  <Input
                    id="totalRounds"
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                    className="col-span-3"
                  />
                )}
              />
              {errors.totalRounds && <p className="col-span-4 text-destructive text-sm text-right">{errors.totalRounds.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leadPoints" className="text-right">
                Lead Points to Win
              </Label>
              <Controller
                name="leadPoints"
                control={control}
                render={({ field }) => (
                  <Input
                    id="leadPoints"
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                    className="col-span-3"
                  />
                )}
              />
              {errors.leadPoints && <p className="col-span-4 text-destructive text-sm text-right">{errors.leadPoints.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="restTime" className="text-right">
                Rest Time (s)
              </Label>
              <Controller
                name="restTime"
                control={control}
                render={({ field }) => (
                  <Input
                    id="restTime"
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                    className="col-span-3"
                  />
                )}
              />
              {errors.restTime && <p className="col-span-4 text-destructive text-sm text-right">{errors.restTime.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxGamJeom" className="text-right">
                Max Gam Jeom
              </Label>
              <Controller
                name="maxGamJeom"
                control={control}
                render={({ field }) => (
                  <Input
                    id="maxGamJeom"
                    type="number"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                    className="col-span-3"
                  />
                )}
              />
              {errors.maxGamJeom && <p className="col-span-4 text-destructive text-sm text-right">{errors.maxGamJeom.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline" type="button">
                    Cancel
                </Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
