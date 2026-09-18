# Contrato crítico — aviso de próxima ventana

**Severidad 1.** No es una nota de diseño: es un requisito funcional.

En la pantalla 05 la app **promete** avisar antes de cada ventana de sueño. Si ese aviso no llega, la familia pierde la ventana, vuelve a calcular a mano y Nocttua deja de ser un sistema. Un fallo de entrega es un incidente de severidad 1, no un bug de notificaciones.

**Promesa al usuario:** aviso 20 minutos antes de la próxima ventana, por bebé, con o sin internet.

## 1 · Local primero

La notificación se agenda **en el dispositivo**, al cerrar cada registro de sueño o toma y en cada recálculo de ventana.

```
canal principal:  local-notification
se agenda en:     onSleepRecordCommitted + onWindowRecalculated
requiere red:     no
antelación:       20 min
```

Nunca se depende de red, servidor ni push para la vía principal.

## 2 · Push remoto = redundancia

El push es respaldo, jamás la vía principal. Se deduplica por `alertKey`; **se tolera un aviso duplicado, nunca uno ausente.** Ante la duda, avisar dos veces.

## 3 · Una alerta viva por bebé

```
alertKey:        babyId + windowStartLocalISO
reprogramación:  cancelar y reemplazar por alertKey en cada recálculo (idempotente)
```

Con dos bebés hay dos ventanas vivas y dos alertas independientes.

## 4 · Sin permiso, sin promesa

Si el permiso está denegado:

- cambiar el copy: la app **no** promete avisar;
- mostrar la ventana en Hoy, en el widget y en la pantalla de bloqueo si se puede;
- ofrecer reactivar el permiso desde Ajustes, sin insistir más de una vez por semana.

Si el reloj o los datos son dudosos: **nunca callar.** Avisar con el último cálculo válido y marcarlo como estimado.

## 5 · Se mide o no existe

```
telemetría:  alert_scheduled · alert_delivered · alert_missed · permission_state
objetivo:    ≥ 99,5% de entrega
al fallar:   incidente severidad 1 + reintento inmediato al reabrir la app
```
