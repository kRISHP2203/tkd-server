'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GameSettings } from '@/app/page';

const settingsSchema = z.object({
  roundTime: z.number().min(10, "Round time must be at least 10 seconds."),
  totalRounds: z.number().min(1, "There must be at least 1 round."),
  leadPoints: z.number().min(1, "Lead points must be at least 1."),
  restTime: z.number().min(10, "Rest time must be at least 10 seconds."),
  maxGamJeom: z.number().min(1, "Max penalties must be at least 1."),
});

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
}

export default function SettingsDialog({ isOpen, onOpenChange, settings, onSave }: SettingsDialogProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GameSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const onSubmit = (data: GameSettings) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription>
            Configure the rules for the match.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
              Max Penalties
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
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
