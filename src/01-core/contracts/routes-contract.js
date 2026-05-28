/**
 * @file routes-contract.js
 * @description Diccionario central de enrutamiento y carga lazy (SDUI).
 */

export const VALID_ROLES = ['guest', 'inv', 'agent', 'admin'];

export const ROUTES = [
    {
        path: '/',
        tag: 'aip-billboard-view',
        chunk: '/src/verticals/aip/views/aip-billboard-view.js',
        requiresAuth: false,
        requiredRoles: VALID_ROLES
    },
    {
        path: '/crm',
        tag: 'aip-trinity-layout',
        chunk: '/gadgets/aip-trinity-layout.js',
        requiresAuth: true,
        requiredRoles: ['inv', 'agent', 'admin']
    },
    {
        path: '/vault',
        tag: 'aip-vault-detail',
        chunk: '/src/verticals/aip/views/aip-vault-detail.js',
        requiresAuth: true,
        requiredRoles: ['inv', 'admin']
    },
    {
        path: '/blocked',
        tag: 'aip-access-blocked',
        chunk: '/src/verticals/aip/views/aip-access-blocked.js',
        requiresAuth: false,
        requiredRoles: VALID_ROLES
    }
];
