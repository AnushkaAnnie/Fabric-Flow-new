import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  count: string;

  @IsString()
  @IsNotEmpty()
  quality: string;

  @IsInt()
  bags: number;

  @IsNumber()
  bagWeight: number;

  @IsNumber()
  totalWeight: number;

  @IsNumber()
  rate: number;

  @IsNumber()
  cgst: number;

  @IsNumber()
  sgst: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  poNumber: string;

  @IsString()
  @IsNotEmpty()
  hfCode: string;

  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @IsString()
  @IsNotEmpty()
  supplierAddress: string;

  @IsString()
  @IsNotEmpty()
  supplierGST: string;

  @IsString()
  @IsOptional()
  agent?: string;

  @IsDateString()
  date: string;

  @IsDateString()
  deliveryDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}
