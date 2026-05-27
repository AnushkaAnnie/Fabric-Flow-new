import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateJobCardDto {
  @IsNumber()
  productionPlanId: number;

  @IsOptional()
  @IsString()
  machineNo?: string;

  @IsOptional()
  @IsString()
  operatorName?: string;

  @IsOptional()
  @IsString()
  shift?: string;

  @IsNumber()
  targetWeight: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}
