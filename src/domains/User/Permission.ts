import { registerEnumType } from 'type-graphql';

export enum Permission {
  CREATEORDER = 'CREATEORDER',
  READORDER = 'READORDER',
  UPDATEORDER = 'UPDATEORDER',
  DELETEORDER = 'DELETEORDER',

  CREATEPAYMENT = 'CREATEPAYMENT',
  READPAYMENT = 'READPAYMENT',
  UPDATEPAYMENT = 'UPDATEPAYMENT',
  DELETEPAYMENT = 'DELETEPAYMENT',
  CANCELPAYMENT = 'CANCELPAYMENT',

  CREATEPRODUCT = 'CREATEPRODUCT',
  READPRODUCT = 'READPRODUCT',
  UPDATEPRODUCT = 'UPDATEPRODUCT',
  DELETEPRODUCT = 'DELETEPRODUCT',

  CREATEASSET = 'CREATEASSET',
  READASSET = 'READASSET',
  UPDATEASSET = 'UPDATEASSET',
  DELETEASSET = 'DELETEASSET',

  UPDATEUSERPERMISSION = 'UPDATEUSERPERMISSION',
}

registerEnumType(Permission, {
  name: 'Permission',
  description: 'User permissions',
});