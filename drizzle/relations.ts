import { relations } from "drizzle-orm/relations";
import { products, alerts, movements, users } from "./schema";

export const alertsRelations = relations(alerts, ({one}) => ({
	product: one(products, {
		fields: [alerts.produtoId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	alerts: many(alerts),
	movements: many(movements),
}));

export const movementsRelations = relations(movements, ({one}) => ({
	product: one(products, {
		fields: [movements.produtoId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [movements.usuarioId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	movements: many(movements),
}));