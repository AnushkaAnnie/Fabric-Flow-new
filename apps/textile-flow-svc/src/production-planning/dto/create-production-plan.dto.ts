import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductionPlanDto {
  @IsString()
  lotNo: string;

  @IsString()
  stage: string;

  @IsNumber()
  plannedWeight: number;

  @IsDateString()
  plannedDate: string;

  @IsString()
  priority: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
