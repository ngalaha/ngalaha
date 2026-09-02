import { createLocalCollection } from './localCollection';
import { generateId, nowIso } from '../utils/id';
import type { Order } from '../models/Order';

const ordersDb = createLocalCollection<Order>('orders');

export async function listOrders(): Promise<Order[]> {
  const items = await ordersDb.getAll();
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return ordersDb.getById(id);
}

export async function saveOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Order> {
  const timestamp = nowIso();
  const existing = order.id ? await ordersDb.getById(order.id) : undefined;
  const saved: Order = {
    ...order,
    id: order.id ?? generateId(),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  return ordersDb.upsert(saved);
}

export async function deleteOrder(id: string): Promise<void> {
  await ordersDb.remove(id);
}
