--
-- PostgreSQL database dump
--

-- Dumped from database version 12.4
-- Dumped by pg_dump version 12.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: movementtype; Type: TYPE; Schema: public; Owner: openpg
--

CREATE TYPE public.movementtype AS ENUM (
    'in_',
    'out'
);


ALTER TYPE public.movementtype OWNER TO openpg;

--
-- Name: orderstatus; Type: TYPE; Schema: public; Owner: openpg
--

CREATE TYPE public.orderstatus AS ENUM (
    'pending',
    'in_production',
    'completed',
    'cancelled',
    'shipped'
);


ALTER TYPE public.orderstatus OWNER TO openpg;

--
-- Name: paymentstatus; Type: TYPE; Schema: public; Owner: openpg
--

CREATE TYPE public.paymentstatus AS ENUM (
    'pending',
    'paid',
    'overdue',
    'partial'
);


ALTER TYPE public.paymentstatus OWNER TO openpg;

--
-- Name: productionstatus; Type: TYPE; Schema: public; Owner: openpg
--

CREATE TYPE public.productionstatus AS ENUM (
    'planned',
    'in_progress',
    'completed',
    'failed'
);


ALTER TYPE public.productionstatus OWNER TO openpg;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: openpg
--

CREATE TYPE public.userrole AS ENUM (
    'admin',
    'user'
);


ALTER TYPE public.userrole OWNER TO openpg;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying NOT NULL,
    entity character varying,
    entity_id integer,
    details character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.activity_logs OWNER TO openpg;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activity_logs_id_seq OWNER TO openpg;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: bom_items; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.bom_items (
    id integer NOT NULL,
    bom_id integer NOT NULL,
    raw_material_id integer NOT NULL,
    quantity_required double precision NOT NULL
);


ALTER TABLE public.bom_items OWNER TO openpg;

--
-- Name: bom_items_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.bom_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bom_items_id_seq OWNER TO openpg;

--
-- Name: bom_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.bom_items_id_seq OWNED BY public.bom_items.id;


--
-- Name: boms; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.boms (
    id integer NOT NULL,
    product_id integer NOT NULL,
    version integer,
    notes character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.boms OWNER TO openpg;

--
-- Name: boms_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.boms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.boms_id_seq OWNER TO openpg;

--
-- Name: boms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.boms_id_seq OWNED BY public.boms.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying NOT NULL,
    phone character varying,
    email character varying,
    address text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    payment_term_days integer
);


ALTER TABLE public.customers OWNER TO openpg;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO openpg;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: debts; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.debts (
    id integer NOT NULL,
    creditor character varying NOT NULL,
    description character varying,
    total_amount double precision NOT NULL,
    paid_amount double precision,
    due_date date NOT NULL,
    paid_date date,
    status character varying,
    notes character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.debts OWNER TO openpg;

--
-- Name: debts_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.debts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.debts_id_seq OWNER TO openpg;

--
-- Name: debts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.debts_id_seq OWNED BY public.debts.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity double precision NOT NULL,
    unit_price double precision
);


ALTER TABLE public.order_items OWNER TO openpg;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_id_seq OWNER TO openpg;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    customer_name character varying NOT NULL,
    customer_phone character varying,
    customer_email character varying,
    status public.orderstatus,
    notes character varying,
    created_at timestamp with time zone DEFAULT now(),
    customer_id integer,
    shipped_at timestamp with time zone
);


ALTER TABLE public.orders OWNER TO openpg;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO openpg;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer,
    customer_name character varying NOT NULL,
    total_amount double precision NOT NULL,
    paid_amount double precision,
    due_date date NOT NULL,
    paid_date date,
    status public.paymentstatus,
    notes character varying,
    created_at timestamp with time zone DEFAULT now(),
    description character varying,
    order_date date,
    items_json text
);


ALTER TABLE public.payments OWNER TO openpg;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payments_id_seq OWNER TO openpg;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: productions; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.productions (
    id integer NOT NULL,
    product_id integer NOT NULL,
    order_id integer,
    quantity double precision NOT NULL,
    status public.productionstatus,
    total_cost double precision,
    notes character varying,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);


ALTER TABLE public.productions OWNER TO openpg;

--
-- Name: productions_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.productions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.productions_id_seq OWNER TO openpg;

--
-- Name: productions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.productions_id_seq OWNED BY public.productions.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying NOT NULL,
    sale_price double precision,
    stock_quantity double precision,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO openpg;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO openpg;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: raw_materials; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.raw_materials (
    id integer NOT NULL,
    name character varying NOT NULL,
    unit character varying NOT NULL,
    stock_quantity double precision,
    min_stock_level double precision,
    purchase_price double precision,
    supplier_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.raw_materials OWNER TO openpg;

--
-- Name: raw_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.raw_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.raw_materials_id_seq OWNER TO openpg;

--
-- Name: raw_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.raw_materials_id_seq OWNED BY public.raw_materials.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.settings (
    key character varying NOT NULL,
    value character varying NOT NULL
);


ALTER TABLE public.settings OWNER TO openpg;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.stock_movements (
    id integer NOT NULL,
    material_id integer,
    product_id integer,
    type public.movementtype NOT NULL,
    quantity double precision NOT NULL,
    description character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.stock_movements OWNER TO openpg;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.stock_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stock_movements_id_seq OWNER TO openpg;

--
-- Name: stock_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.stock_movements_id_seq OWNED BY public.stock_movements.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name character varying NOT NULL,
    phone character varying,
    email character varying,
    address character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.suppliers OWNER TO openpg;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.suppliers_id_seq OWNER TO openpg;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: openpg
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    role public.userrole,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO openpg;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: openpg
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO openpg;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: openpg
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: bom_items id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.bom_items ALTER COLUMN id SET DEFAULT nextval('public.bom_items_id_seq'::regclass);


--
-- Name: boms id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.boms ALTER COLUMN id SET DEFAULT nextval('public.boms_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: debts id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.debts ALTER COLUMN id SET DEFAULT nextval('public.debts_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: productions id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.productions ALTER COLUMN id SET DEFAULT nextval('public.productions_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: raw_materials id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.raw_materials ALTER COLUMN id SET DEFAULT nextval('public.raw_materials_id_seq'::regclass);


--
-- Name: stock_movements id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.stock_movements ALTER COLUMN id SET DEFAULT nextval('public.stock_movements_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.activity_logs (id, user_id, action, entity, entity_id, details, created_at) FROM stdin;
1	1	DELETE	BOM	2	\N	2026-03-30 13:55:39.439573+03
2	1	DELETE	BOM	1	\N	2026-03-30 13:56:13.275247+03
3	1	DELETE	RawMaterial	1	\N	2026-03-30 13:56:21.960862+03
4	1	DELETE	RawMaterial	2	\N	2026-03-30 13:56:24.408233+03
5	1	DELETE	RawMaterial	3	\N	2026-03-30 13:56:27.244927+03
6	1	DELETE	RawMaterial	4	\N	2026-03-30 13:56:33.447179+03
7	1	DELETE	Supplier	1	\N	2026-03-30 13:58:05.669081+03
8	1	DELETE	Supplier	2	\N	2026-03-30 13:58:08.763777+03
9	1	CREATE	Supplier	3	Tedarikçi oluşturuldu: Aura kimya	2026-03-30 13:58:22.558329+03
10	1	CREATE	Supplier	4	Tedarikçi oluşturuldu: Bahar kimya	2026-03-30 13:58:38.09989+03
11	1	CREATE	Supplier	5	Tedarikçi oluşturuldu: Badıllı kimya	2026-03-30 13:58:52.189577+03
12	1	CREATE	Supplier	6	Tedarikçi oluşturuldu: Türev kimya	2026-03-30 14:00:09.234704+03
13	1	CREATE	RawMaterial	5	Hammadde oluşturuldu: Alfagrin türev boyası	2026-03-30 14:00:38.550155+03
14	1	UPDATE	RawMaterial	5	\N	2026-03-30 14:00:55.327217+03
15	1	UPDATE	RawMaterial	5	\N	2026-03-30 14:01:08.652583+03
16	1	UPDATE	RawMaterial	5	\N	2026-03-30 14:01:16.230396+03
17	1	UPDATE	RawMaterial	5	\N	2026-03-30 14:01:27.264098+03
18	1	CREATE	RawMaterial	6	Hammadde oluşturuldu: Ate	2026-03-30 14:02:29.034302+03
19	1	CREATE	RawMaterial	7	Hammadde oluşturuldu: Aura 1001 asit	2026-03-30 14:03:10.742481+03
20	1	CREATE	RawMaterial	8	Hammadde oluşturuldu: Aura 101	2026-03-30 14:03:40.616055+03
21	1	CREATE	RawMaterial	9	Hammadde oluşturuldu: Aura 60	2026-03-30 14:04:06.963992+03
22	1	CREATE	RawMaterial	10	Hammadde oluşturuldu: Aura Ampo	2026-03-30 14:05:20.441905+03
23	1	CREATE	RawMaterial	11	Hammadde oluşturuldu: Butil	2026-03-30 14:07:40.155532+03
24	1	CREATE	RawMaterial	12	Hammadde oluşturuldu: Camsil boyası	2026-03-30 14:08:11.904587+03
25	1	CREATE	RawMaterial	13	Hammadde oluşturuldu: Cila	2026-03-30 14:08:44.261518+03
26	1	CREATE	RawMaterial	14	Hammadde oluşturuldu: Coco amide	2026-03-30 14:09:32.492169+03
27	1	CREATE	RawMaterial	15	Hammadde oluşturuldu: El temizleme kremi	2026-03-30 14:10:21.548336+03
28	1	CREATE	RawMaterial	16	Hammadde oluşturuldu: Esans 697	2026-03-30 14:10:56.81635+03
29	1	CREATE	RawMaterial	17	Hammadde oluşturuldu: Esans 698	2026-03-30 14:11:26.295621+03
30	1	CREATE	Supplier	7	Tedarikçi oluşturuldu: Dede kimya	2026-03-30 14:12:32.112055+03
31	1	CREATE	RawMaterial	18	Hammadde oluşturuldu: Eski cila miglatörü	2026-03-30 14:13:33.192114+03
32	1	CREATE	RawMaterial	19	Hammadde oluşturuldu: Etil alkol	2026-03-30 14:14:05.554473+03
33	1	CREATE	RawMaterial	20	Hammadde oluşturuldu: Fosforik asit	2026-03-30 14:14:43.04482+03
34	1	CREATE	Supplier	8	Tedarikçi oluşturuldu: Şutim	2026-03-30 14:15:35.903608+03
35	1	CREATE	RawMaterial	21	Hammadde oluşturuldu: Glikol Şurubu	2026-03-30 14:15:59.197805+03
36	1	CREATE	RawMaterial	22	Hammadde oluşturuldu: Gliserin farma	2026-03-30 14:16:42.017398+03
37	1	CREATE	RawMaterial	23	Hammadde oluşturuldu: Grim FL 280 türev	2026-03-30 14:18:23.625029+03
38	1	CREATE	RawMaterial	24	Hammadde oluşturuldu: Ham gliserin	2026-03-30 14:19:09.498021+03
39	1	CREATE	RawMaterial	25	Hammadde oluşturuldu: Hedp 	2026-03-30 14:19:44.462135+03
40	1	CREATE	Supplier	9	Tedarikçi oluşturuldu: Aktarcı	2026-03-30 14:20:30.661142+03
41	1	CREATE	RawMaterial	26	Hammadde oluşturuldu: Hint yağı	2026-03-30 14:20:36.603015+03
42	1	UPDATE	RawMaterial	26	\N	2026-03-30 14:20:49.939141+03
43	1	CREATE	RawMaterial	27	Hammadde oluşturuldu: Kostik 	2026-03-30 14:21:22.590652+03
44	1	CREATE	RawMaterial	28	Hammadde oluşturuldu: Köpük kesici Aura	2026-03-30 14:22:34.849695+03
45	1	CREATE	RawMaterial	29	Hammadde oluşturuldu: Köpük kesici Badıllı	2026-03-30 14:23:15.943565+03
46	1	CREATE	RawMaterial	30	Hammadde oluşturuldu: Kıvamlaştırıcı 	2026-03-30 14:23:45.619218+03
47	1	CREATE	RawMaterial	31	Hammadde oluşturuldu: Limon esansı	2026-03-30 14:24:30.134723+03
48	1	CREATE	RawMaterial	32	Hammadde oluşturuldu: Makro işçilik	2026-03-30 14:25:42.239048+03
49	1	CREATE	RawMaterial	33	Hammadde oluşturuldu: Mavi türev boyası	2026-03-30 14:26:20.919374+03
50	1	CREATE	RawMaterial	34	Hammadde oluşturuldu: Metasilikat	2026-03-30 14:26:53.757998+03
51	1	CREATE	RawMaterial	35	Hammadde oluşturuldu: Metil Alkol	2026-03-30 14:27:13.502429+03
52	1	CREATE	RawMaterial	36	Hammadde oluşturuldu: NP10 	2026-03-30 14:27:41.433501+03
53	1	CREATE	RawMaterial	37	Hammadde oluşturuldu: Nitrik asit	2026-03-30 14:28:18.406946+03
54	1	CREATE	RawMaterial	38	Hammadde oluşturuldu: Opak 	2026-03-30 14:28:49.859795+03
55	1	CREATE	Supplier	10	Tedarikçi oluşturuldu: Peros beyaz kağıt fabrikası	2026-03-30 14:29:35.259597+03
56	1	CREATE	RawMaterial	39	Hammadde oluşturuldu: Sales 	2026-03-30 14:29:37.772593+03
57	1	UPDATE	RawMaterial	39	\N	2026-03-30 14:29:53.23548+03
58	1	CREATE	RawMaterial	40	Hammadde oluşturuldu: Silikonlu cam boyası	2026-03-30 14:30:42.914827+03
59	1	CREATE	RawMaterial	41	Hammadde oluşturuldu: Silikonlu camsu	2026-03-30 14:31:21.372636+03
60	1	CREATE	RawMaterial	42	Hammadde oluşturuldu: Sttp 	2026-03-30 14:31:51.268162+03
61	1	CREATE	RawMaterial	43	Hammadde oluşturuldu: Süt	2026-03-30 14:32:59.867288+03
62	1	CREATE	RawMaterial	44	Hammadde oluşturuldu: Tablet Tuz	2026-03-30 14:33:28.295896+03
63	1	CREATE	RawMaterial	45	Hammadde oluşturuldu: Tampon 	2026-03-30 14:34:08.149318+03
64	1	CREATE	RawMaterial	46	Hammadde oluşturuldu: Tuz	2026-03-30 14:34:29.433749+03
65	1	CREATE	RawMaterial	47	Hammadde oluşturuldu: Ucuz koruyucu	2026-03-30 14:35:00.170222+03
66	1	CREATE	RawMaterial	48	Hammadde oluşturuldu: Yeşil türev	2026-03-30 14:35:33.647943+03
67	1	CREATE	RawMaterial	49	Hammadde oluşturuldu: Zift temizleyici	2026-03-30 14:36:06.561095+03
68	1	CREATE	RawMaterial	50	Hammadde oluşturuldu: İPA Alkol	2026-03-30 14:36:34.879488+03
69	1	CREATE	RawMaterial	51	Hammadde oluşturuldu: İyi koruyucu	2026-03-30 14:37:02.973298+03
70	1	DELETE	Product	1	\N	2026-03-30 14:37:22.662948+03
71	1	DELETE	Product	2	\N	2026-03-30 14:37:24.874399+03
72	1	CREATE	Product	3	Ürün oluşturuldu: Beyaz köpük	2026-03-30 14:37:58.782412+03
73	1	CREATE	Product	4	Ürün oluşturuldu: Pembe köpük	2026-03-30 14:38:20.705811+03
74	1	CREATE	BOM	3	Reçete oluşturuldu: Beyaz köpük v1	2026-03-30 14:40:21.964302+03
75	1	CREATE	Product	5	Ürün oluşturuldu: Demir tozu	2026-03-30 14:42:08.015844+03
76	1	CREATE	BOM	4	Reçete oluşturuldu: Demir tozu v1	2026-03-30 14:43:00.945168+03
77	1	CREATE	Product	6	Ürün oluşturuldu: Detay temizleyici	2026-03-30 14:45:09.406465+03
78	1	DELETE	BOM	4	\N	2026-03-30 14:49:44.866392+03
79	1	CREATE	Customer	1	Müşteri oluşturuldu: Savera Karaköprü	2026-03-30 15:35:20.905659+03
80	1	CREATE	Customer	2	Müşteri oluşturuldu: Savera delen şube	2026-03-30 15:35:33.267341+03
81	1	CREATE	Customer	3	Müşteri oluşturuldu: Saver konutlu şube	2026-03-30 15:35:49.89612+03
82	1	CREATE	Customer	4	Müşteri oluşturuldu: Savera sırrın şube	2026-03-30 15:36:07.499173+03
85	1	PRODUCTION_START	Order	1	Sipariş üretime alındı	2026-03-30 15:36:57.210216+03
83	1	CREATE	Customer	5	Müşteri oluşturuldu: Savera adıyaman şube	2026-03-30 15:36:17.748469+03
87	1	CREATE	Order	2	Sipariş oluşturuldu: Savera Karaköprü	2026-03-30 15:39:08.30186+03
84	1	CREATE	Order	1	Sipariş oluşturuldu: Savera Karaköprü	2026-03-30 15:36:50.46128+03
86	1	DELETE	Order	1	\N	2026-03-30 15:37:32.259134+03
88	1	UPDATE	Product	3	\N	2026-03-30 15:39:16.205849+03
89	1	DELETE	Order	2	\N	2026-03-30 15:39:26.576182+03
90	1	CREATE	Order	3	Sipariş oluşturuldu: Savera Karaköprü	2026-03-30 15:39:40.308975+03
91	1	CREATE	Order	4	Sipariş oluşturuldu: Savera delen şube	2026-03-30 16:01:53.017297+03
92	1	PRODUCTION_START	Order	4	Sipariş üretime alındı	2026-03-30 16:02:33.499985+03
93	1	CREATE	Payment	1	Vade oluşturuldu: Savera Sırrın şube 	2026-03-30 16:24:09.75888+03
94	1	CREATE	Payment	2	Vade oluşturuldu: Savera sırrın şube 	2026-03-30 16:25:42.585199+03
95	1	CREATE	Payment	3	Vade oluşturuldu: Savera kara köprü şube	2026-03-30 16:30:06.88074+03
96	1	CREATE	Payment	4	Vade oluşturuldu: Savera delen şubesi	2026-03-30 16:31:43.698625+03
97	1	CREATE	Payment	5	Vade oluşturuldu: Savera konuklu şubesi	2026-03-30 16:34:52.402154+03
98	1	STOCK_ADJUST	RawMaterial	21	Miktar: 100.0	2026-03-30 17:30:49.44221+03
99	1	STOCK_ADJUST	RawMaterial	22	Miktar: 105.0	2026-03-30 17:31:06.72637+03
100	1	CREATE	Product	7	Ürün oluşturuldu: Lastik parlatıcısı	2026-03-30 17:33:28.92899+03
101	1	CREATE	Order	5	Sipariş oluşturuldu: Savera Karaköprü	2026-03-30 17:34:44.701708+03
102	1	PRODUCTION_START	Order	5	Sipariş üretime alındı	2026-03-30 17:34:56.464793+03
103	1	DELETE	Order	5	\N	2026-03-30 17:35:13.954646+03
104	1	CREATE	Customer	6	Müşteri oluşturuldu: Karaköprü Savera dolum	2026-03-30 17:35:37.864196+03
105	1	UPDATE	Product	7	\N	2026-03-30 17:36:23.218726+03
106	1	CREATE	Order	6	Sipariş oluşturuldu: Karaköprü Savera dolum	2026-03-30 17:36:34.595644+03
107	1	PRODUCTION_START	Order	6	Sipariş üretime alındı	2026-03-30 17:36:37.759987+03
108	1	CREATE	Customer	7	Müşteri oluşturuldu: Kendimiz	2026-03-30 17:37:04.214706+03
109	1	CREATE	Order	7	Sipariş oluşturuldu: Kendimiz	2026-03-30 17:37:23.045567+03
110	1	PRODUCTION_START	Order	7	Sipariş üretime alındı	2026-03-30 17:37:29.620202+03
111	1	PRODUCTION_START	Order	3	Sipariş üretime alındı	2026-03-30 17:37:35.060503+03
112	1	UPDATE	RawMaterial	8	\N	2026-03-30 17:46:20.014829+03
113	1	UPDATE	RawMaterial	27	\N	2026-03-30 17:49:47.978244+03
114	1	UPDATE	RawMaterial	29	\N	2026-03-30 17:50:13.097422+03
115	1	UPDATE	RawMaterial	33	\N	2026-03-30 17:51:31.42891+03
116	1	UPDATE	RawMaterial	38	\N	2026-03-30 17:52:13.241544+03
117	1	UPDATE	RawMaterial	48	\N	2026-03-30 17:54:11.086215+03
118	1	UPDATE	Customer	6	\N	2026-03-30 17:56:17.681993+03
119	1	UPDATE	Customer	3	\N	2026-03-30 17:56:27.970777+03
120	1	UPDATE	Customer	5	\N	2026-03-30 17:56:48.130353+03
121	1	UPDATE	Customer	1	\N	2026-03-30 17:56:51.623525+03
122	1	UPDATE	Customer	2	\N	2026-03-30 17:56:56.782624+03
123	1	UPDATE	Customer	4	\N	2026-03-30 17:57:00.434521+03
124	1	CREATE	Order	8	Sipariş oluşturuldu: Karaköprü Savera dolum	2026-03-30 17:57:31.110067+03
125	1	PRODUCTION_START	Order	8	Sipariş üretime alındı	2026-03-30 17:57:35.34957+03
126	1	SHIP	Order	8	Sevkiyata alındı+ vade kaydı oluşturuldu	2026-03-30 17:57:37.592211+03
127	1	DELETE	Order	8	\N	2026-03-30 17:58:44.844274+03
128	1	COMPLETE	Order	7	\N	2026-03-30 18:03:35.40093+03
129	1	DELETE	Order	7	\N	2026-03-30 18:05:53.697249+03
130	1	DELETE	Order	6	\N	2026-03-30 18:05:57.107992+03
131	1	CREATE	BOM	5	Reçete oluşturuldu: Lastik parlatıcısı v1	2026-03-30 18:14:50.326441+03
132	1	CREATE	RawMaterial	52	Hammadde oluşturuldu: Silikon	2026-03-30 18:16:02.435227+03
133	1	UPDATE	BOM	5	\N	2026-03-30 18:16:52.809856+03
134	1	CREATE	RawMaterial	53	Hammadde oluşturuldu: su	2026-03-30 18:17:21.546237+03
135	1	UPDATE	BOM	5	\N	2026-03-30 18:17:49.554497+03
136	1	CREATE	Order	9	Sipariş oluşturuldu: Karaköprü Savera dolum	2026-03-30 18:18:33.552948+03
137	1	PRODUCTION_START	Order	9	Sipariş üretime alındı	2026-03-30 18:18:35.81296+03
138	1	CREATE	Order	10	Sipariş oluşturuldu: Kendimiz	2026-03-30 18:18:58.828278+03
139	1	PRODUCTION_START	Order	10	Sipariş üretime alındı	2026-03-30 18:19:01.756256+03
140	1	CREATE	BOM	6	Reçete oluşturuldu: Detay temizleyici v1	2026-03-31 10:34:48.028881+03
141	1	UPDATE	BOM	6	\N	2026-03-31 10:37:12.570303+03
142	1	CREATE	Order	11	Sipariş oluşturuldu: Karaköprü Savera dolum	2026-03-31 10:38:17.673642+03
143	1	PRODUCTION_START	Order	11	Sipariş üretime alındı	2026-03-31 10:38:28.116374+03
144	1	CREATE	BOM	7	Reçete oluşturuldu: Pembe köpük v1	2026-03-31 11:01:24.826084+03
145	1	CREATE	Order	12	Sipariş oluşturuldu: Kendimiz	2026-03-31 11:01:38.164101+03
146	1	PRODUCTION_START	Order	12	Sipariş üretime alındı	2026-03-31 11:01:45.45643+03
147	1	DELETE	Order	12	\N	2026-03-31 11:01:59.869353+03
148	1	DELETE	BOM	7	\N	2026-03-31 11:02:06.637931+03
149	1	CREATE	BOM	8	Reçete oluşturuldu: Pembe köpük v1	2026-03-31 11:07:00.851835+03
150	1	CREATE	Order	13	Sipariş oluşturuldu: Kendimiz	2026-03-31 11:07:13.118326+03
151	1	PRODUCTION_START	Order	13	Sipariş üretime alındı	2026-03-31 11:07:15.648019+03
152	1	PRODUCTION	Production	2	Pembe köpük x1.0 üretildi	2026-03-31 11:07:19.066732+03
153	1	DELETE	Order	13	\N	2026-03-31 11:07:57.387044+03
154	1	DELETE	BOM	8	\N	2026-03-31 11:08:01.160165+03
155	1	UPDATE	RawMaterial	6	\N	2026-03-31 11:08:15.108327+03
156	1	CREATE	Order	14	Sipariş oluşturuldu: Karaköprü Savera dolum	2026-03-31 11:09:14.651433+03
157	1	DELETE	Order	11	\N	2026-03-31 11:09:25.834424+03
158	1	CREATE	Order	15	Sipariş oluşturuldu: Kendimiz	2026-03-31 11:10:38.518486+03
159	1	DELETE	Order	10	\N	2026-03-31 11:10:49.050308+03
160	1	CREATE	Order	16	Sipariş oluşturuldu: Karaköprü Savera dolum	2026-03-31 11:11:07.637241+03
161	1	DELETE	Order	9	\N	2026-03-31 11:11:19.682599+03
162	1	CREATE	Order	17	Sipariş oluşturuldu: Savera delen şube	2026-03-31 11:12:00.965685+03
163	1	DELETE	Order	4	\N	2026-03-31 11:12:16.115863+03
164	1	CREATE	Order	18	Sipariş oluşturuldu: Savera Karaköprü	2026-03-31 11:12:45.365565+03
165	1	DELETE	Order	3	\N	2026-03-31 11:12:49.847125+03
166	1	PRODUCTION_START	Order	18	Sipariş üretime alındı	2026-03-31 11:12:56.841215+03
167	1	PRODUCTION_START	Order	17	Sipariş üretime alındı	2026-03-31 11:12:57.781864+03
168	1	PRODUCTION_START	Order	16	Sipariş üretime alındı	2026-03-31 11:12:58.487176+03
169	1	PRODUCTION_START	Order	15	Sipariş üretime alındı	2026-03-31 11:12:59.367428+03
170	1	PRODUCTION_START	Order	14	Sipariş üretime alındı	2026-03-31 11:13:00.408944+03
171	1	PRODUCTION	Production	8	Detay temizleyici x200.0 üretildi	2026-03-31 11:13:13.329797+03
172	1	UPDATE	BOM	3	\N	2026-03-31 11:31:05.333665+03
173	1	PRODUCTION	Production	9	Beyaz köpük x650.0 üretildi	2026-03-31 11:31:11.753276+03
174	1	UPDATE	BOM	5	\N	2026-03-31 11:43:21.674656+03
175	1	UPDATE	BOM	5	\N	2026-03-31 11:44:41.459382+03
176	1	PRODUCTION	Production	10	Lastik parlatıcısı x110.0 üretildi	2026-03-31 11:44:49.288486+03
177	1	PRODUCTION	Production	11	Lastik parlatıcısı x75.0 üretildi	2026-03-31 11:44:50.64435+03
178	1	STOCK_ADJUST	RawMaterial	32	Miktar: 100.0	2026-03-31 11:45:08.592869+03
180	1	UPDATE	Customer	6	\N	2026-03-31 11:52:50.362069+03
179	1	PRODUCTION	Production	12	Beyaz köpük x550.0 üretildi	2026-03-31 11:45:15.620417+03
182	1	UPDATE	Customer	2	\N	2026-03-31 11:53:18.523925+03
185	1	UPDATE	Customer	5	\N	2026-03-31 11:54:21.556125+03
187	1	CREATE	Product	9	Ürün oluşturuldu: Motor yağı çözücüsü	2026-03-31 12:03:50.112818+03
190	1	CREATE	Product	12	Ürün oluşturuldu: IT cila	2026-03-31 12:04:43.816287+03
193	1	CREATE	Product	15	Ürün oluşturuldu: Böcek temizleme	2026-03-31 12:05:53.664898+03
196	1	CREATE	Product	18	Ürün oluşturuldu: Oto parfüm	2026-03-31 12:06:57.639525+03
181	1	UPDATE	Customer	1	\N	2026-03-31 11:52:59.891905+03
184	1	UPDATE	Customer	4	\N	2026-03-31 11:53:59.323687+03
188	1	CREATE	Product	10	Ürün oluşturuldu: Jant	2026-03-31 12:04:03.037453+03
191	1	CREATE	Product	13	Ürün oluşturuldu: Leke çıkarıcı	2026-03-31 12:05:03.582737+03
194	1	CREATE	Product	16	Ürün oluşturuldu: Zift temizleme	2026-03-31 12:06:15.346905+03
183	1	UPDATE	Customer	3	\N	2026-03-31 11:53:40.504622+03
186	1	CREATE	Product	8	Ürün oluşturuldu: Torpido parlatıcısı	2026-03-31 12:03:29.027334+03
189	1	CREATE	Product	11	Ürün oluşturuldu: Etiket sökücü	2026-03-31 12:04:13.725426+03
192	1	CREATE	Product	14	Ürün oluşturuldu: Cam su	2026-03-31 12:05:24.680721+03
195	1	CREATE	Product	17	Ürün oluşturuldu: El temizleme kıremi (Sanayi tipi)	2026-03-31 12:06:39.726776+03
197	1	CREATE	RawMaterial	54	Hammadde oluşturuldu: Pembe türev boyası	2026-03-31 12:11:58.145006+03
198	1	UPDATE	RawMaterial	27	\N	2026-03-31 12:14:01.833279+03
199	1	CREATE	Debt	1	Borç: Ali dursun (Aura kimya)	2026-03-31 12:59:32.208499+03
200	1	CREATE	Debt	2	Borç: Banka CC	2026-03-31 13:00:22.625358+03
201	1	CREATE	Debt	3	Borç: İbrahimin abisi	2026-03-31 13:01:36.463379+03
202	1	CREATE	Debt	4	Borç: Can toptan gıda (Sigara)	2026-03-31 13:04:54.650046+03
203	1	CREATE	Debt	5	Borç: Ülker 	2026-03-31 13:07:38.923056+03
204	1	CREATE	Debt	6	Borç: Emay toptan (bebeto)	2026-03-31 13:12:18.980862+03
205	1	CREATE	Debt	7	Borç: Can toptan (Sigara alımı)	2026-03-31 13:27:48.783422+03
\.


--
-- Data for Name: bom_items; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.bom_items (id, bom_id, raw_material_id, quantity_required) FROM stdin;
34	6	34	0.01
35	6	27	0.01
36	6	42	0.01
37	6	8	0.015
38	6	53	0.945
41	3	6	0.004
42	3	9	0.012
43	3	25	0.028
44	3	39	0.044
45	3	11	0.016
46	3	8	0.004
47	3	27	0.04
48	3	32	0.851
55	5	22	0.195
56	5	21	0.136
57	5	30	0.047
58	5	52	0.018
59	5	53	0.293
60	5	47	0.003
\.


--
-- Data for Name: boms; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.boms (id, product_id, version, notes, created_at) FROM stdin;
3	3	1		2026-03-30 14:40:21.932919+03
5	7	1		2026-03-30 18:14:50.313043+03
6	6	1	1 Kg	2026-03-31 10:34:48.006673+03
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.customers (id, name, phone, email, address, notes, created_at, payment_term_days) FROM stdin;
7	Kendimiz					2026-03-30 17:37:04.21161+03	\N
6	Karaköprü Savera dolum	05354990301				2026-03-30 17:35:37.860492+03	15
1	Savera Karaköprü	05354990301				2026-03-30 15:35:20.884432+03	30
2	Savera delen şube	05413119801				2026-03-30 15:35:33.263365+03	30
3	Saver konutlu şube	05308517875 				2026-03-30 15:35:49.89186+03	30
4	Savera sırrın şube	05354990301				2026-03-30 15:36:07.481082+03	30
5	Savera adıyaman şube	05308517875				2026-03-30 15:36:17.729014+03	30
\.


--
-- Data for Name: debts; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.debts (id, creditor, description, total_amount, paid_amount, due_date, paid_date, status, notes, created_at) FROM stdin;
1	Ali dursun (Aura kimya)	Ham madde alımı	134550	0	2026-04-30	\N	pending		2026-03-31 12:59:32.200307+03
2	Banka CC	Kredi kartları	211000	0	2026-03-30	\N	pending		2026-03-31 13:00:22.621948+03
3	İbrahimin abisi	Altın alımı	20	0	2026-05-20	\N	pending	Altın (Gram bazında)	2026-03-31 13:01:36.460264+03
4	Can toptan gıda (Sigara)	Sigara alımı	51846.95	0	2026-03-31	\N	pending	12606 tl de Karaköprü şubesinden eklenip ödenmeli	2026-03-31 13:04:54.646963+03
5	Ülker 	Ürün alımı	9110.52	0	2026-04-06	\N	pending		2026-03-31 13:07:38.919636+03
6	Emay toptan (bebeto)	Ürün alımı	6357.3	0	2026-04-02	\N	pending		2026-03-31 13:12:18.978043+03
7	Can toptan (Sigara alımı)	Karaköprü sigara	12606	0	2026-03-31	\N	pending	Karaköpür şubseinden alınıp ödenecek	2026-03-31 13:27:48.780283+03
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.order_items (id, order_id, product_id, quantity, unit_price) FROM stdin;
14	14	6	200	22
15	15	7	75	52
16	16	7	110	52
17	17	3	650	32
18	18	3	550	32
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.orders (id, customer_name, customer_phone, customer_email, status, notes, created_at, customer_id, shipped_at) FROM stdin;
18	Savera Karaköprü			in_production		2026-03-31 11:12:45.35689+03	1	\N
17	Savera delen şube			in_production		2026-03-31 11:12:00.943937+03	2	\N
16	Karaköprü Savera dolum			in_production		2026-03-31 11:11:07.616881+03	6	\N
15	Kendimiz			in_production		2026-03-31 11:10:38.507172+03	7	\N
14	Karaköprü Savera dolum			in_production		2026-03-31 11:09:14.630693+03	6	\N
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.payments (id, order_id, customer_name, total_amount, paid_amount, due_date, paid_date, status, notes, created_at, description, order_date, items_json) FROM stdin;
2	\N	Savera sırrın şube 	51680	0	2026-04-29	\N	pending	Sipariş tarihi: 25.03.2026	2026-03-30 16:25:42.581558+03	Lastik 50 Kg (35), Koku 40 Kg (33), Cila 10 Kg (31), Pembe köpük 500 Kg (75), Beyaz köpük 400 Kg (27)	\N	\N
3	\N	Savera kara köprü şube	17600	0	2026-04-29	\N	pending	Üretilip depoda bekletildi	2026-03-30 16:30:06.87755+03	Beyaz köpük 550 Kg (32)	\N	\N
4	\N	Savera delen şubesi	35000	0	2026-04-29	\N	pending	Sipariş tarihi: 27.03.2026	2026-03-30 16:31:43.69558+03	Pembe köpük 500 kg (70)	\N	\N
5	\N	Savera konuklu şubesi	14000	0	2026-04-29	\N	pending	Sipariş tarihi: 25.03.2026	2026-03-30 16:34:52.399254+03	Beyaz köpük 100 Kg (27), Pembe köpük 200 Kg (70)	\N	\N
\.


--
-- Data for Name: productions; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.productions (id, product_id, order_id, quantity, status, total_cost, notes, created_at, completed_at) FROM stdin;
2	4	\N	1	completed	5000	\N	2026-03-31 11:07:19.030694+03	2026-03-31 08:07:19.040602+03
8	6	\N	200	completed	1239.45	\N	2026-03-31 11:13:13.290908+03	2026-03-31 08:13:13.30398+03
9	3	\N	650	completed	1668537	\N	2026-03-31 11:31:11.70497+03	2026-03-31 08:31:11.72878+03
10	7	\N	110	completed	5380.6115	\N	2026-03-31 11:44:49.239785+03	2026-03-31 08:44:49.258084+03
11	7	\N	75	completed	3668.59875	\N	2026-03-31 11:44:50.597941+03	2026-03-31 08:44:50.620107+03
12	3	\N	550	completed	1411839	\N	2026-03-31 11:45:15.575914+03	2026-03-31 08:45:15.596299+03
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.products (id, name, sale_price, stock_quantity, created_at) FROM stdin;
5	Demir tozu	108	239.5	2026-03-30 14:42:07.998301+03
4	Pembe köpük	82	21	2026-03-30 14:38:20.685877+03
6	Detay temizleyici	22	400	2026-03-30 14:45:09.387904+03
7	Lastik parlatıcısı	52	335	2026-03-30 17:33:28.925117+03
3	Beyaz köpük	32	1200	2026-03-30 14:37:58.762631+03
8	Torpido parlatıcısı	0	0	2026-03-31 12:03:29.022248+03
9	Motor yağı çözücüsü	0	0	2026-03-31 12:03:50.109578+03
10	Jant	0	0	2026-03-31 12:04:03.034268+03
11	Etiket sökücü	0	0	2026-03-31 12:04:13.72252+03
12	IT cila	0	0	2026-03-31 12:04:43.812828+03
13	Leke çıkarıcı	0	0	2026-03-31 12:05:03.579941+03
14	Cam su	0	0	2026-03-31 12:05:24.677302+03
15	Böcek temizleme	0	0	2026-03-31 12:05:53.661836+03
16	Zift temizleme	0	0	2026-03-31 12:06:15.3428+03
17	El temizleme kıremi (Sanayi tipi)	0	0	2026-03-31 12:06:39.72347+03
18	Oto parfüm	0	0	2026-03-31 12:06:57.636268+03
\.


--
-- Data for Name: raw_materials; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.raw_materials (id, name, unit, stock_quantity, min_stock_level, purchase_price, supplier_id, created_at) FROM stdin;
5	Alfagrin türev boyası	L	0.1	0.05	3.5	6	2026-03-30 14:00:38.520034+03
7	Aura 1001 asit	kg	25	5	800	3	2026-03-30 14:03:10.716419+03
10	Aura Ampo	kg	7	2	1750	3	2026-03-30 14:05:20.421291+03
12	Camsil boyası	kg	2	0.5	200	3	2026-03-30 14:08:11.881774+03
13	Cila	kg	20	5	380	3	2026-03-30 14:08:44.239375+03
14	Coco amide	kg	5	2	380	3	2026-03-30 14:09:32.470948+03
15	El temizleme kremi	kg	200	10	38	3	2026-03-30 14:10:21.52623+03
16	Esans 697	kg	1	1	500	4	2026-03-30 14:10:56.794606+03
17	Esans 698	kg	17	5	500	4	2026-03-30 14:11:26.287971+03
18	Eski cila miglatörü	kg	10	2	250	7	2026-03-30 14:13:33.182518+03
19	Etil alkol	kg	103	15	95	3	2026-03-30 14:14:05.538637+03
20	Fosforik asit	kg	70	10	90	3	2026-03-30 14:14:43.022513+03
23	Grim FL 280 türev	kg	0.9	1	4.22	6	2026-03-30 14:18:23.603792+03
24	Ham gliserin	kg	730	50	43	3	2026-03-30 14:19:09.477063+03
26	Hint yağı	kg	10	2	500	9	2026-03-30 14:20:36.579602+03
28	Köpük kesici Aura	kg	5	2	0	3	2026-03-30 14:22:34.82799+03
31	Limon esansı	kg	3	2	500	4	2026-03-30 14:24:30.126701+03
35	Metil Alkol	kg	0	0	0	\N	2026-03-30 14:27:13.485344+03
36	NP10 	kg	10	5	130	7	2026-03-30 14:27:41.424917+03
37	Nitrik asit	kg	200	40	23	3	2026-03-30 14:28:18.386064+03
40	Silikonlu cam boyası	kg	1	1	2500	3	2026-03-30 14:30:42.895484+03
41	Silikonlu camsu	kg	3	2	1400	3	2026-03-30 14:31:21.36533+03
43	Süt	kg	100	25	285	3	2026-03-30 14:32:59.858757+03
44	Tablet Tuz	kg	30	10	10	8	2026-03-30 14:33:28.273585+03
45	Tampon 	kg	30	10	645	3	2026-03-30 14:34:08.141429+03
46	Tuz	kg	7	5	10	8	2026-03-30 14:34:29.425824+03
49	Zift temizleyici	kg	50	20	220	3	2026-03-30 14:36:06.538035+03
50	İPA Alkol	kg	68	30	100	3	2026-03-30 14:36:34.871057+03
51	İyi koruyucu	kg	10	5	250	3	2026-03-30 14:37:02.952212+03
29	Köpük kesici Badıllı	kg	3	3	250	5	2026-03-30 14:23:15.921028+03
33	Mavi türev boyası	kg	0.2	1	1500	6	2026-03-30 14:26:20.899137+03
38	Opak 	kg	4	5	250	4	2026-03-30 14:28:49.83997+03
48	Yeşil türev	kg	15	10	1500	6	2026-03-30 14:35:33.641064+03
21	Glikol Şurubu	kg	79.83999999999999	5	40	8	2026-03-30 14:15:59.175286+03
22	Gliserin farma	kg	169.925	10	135	3	2026-03-30 14:16:42.000398+03
30	Kıvamlaştırıcı 	kg	6.305	10	250	\N	2026-03-30 14:23:45.598345+03
47	Ucuz koruyucu	kg	14.445	10	85	3	2026-03-30 14:35:00.146662+03
34	Metasilikat	kg	203	40	90	3	2026-03-30 14:26:53.736548+03
42	Sttp 	kg	48	20	110	3	2026-03-30 14:31:51.26081+03
52	Silikon	kg	6.67	2	285	3	2026-03-30 18:16:02.426052+03
53	su	kg	4756.795	0	0.05	\N	2026-03-30 18:17:21.539657+03
6	Ate	kg	35.199999999999996	5	250	3	2026-03-30 14:02:29.01046+03
8	Aura 101	kg	48.199999999999996	10	250	3	2026-03-30 14:03:40.593578+03
9	Aura 60	kg	73.60000000000001	10	140	3	2026-03-30 14:04:06.941614+03
11	Butil	kg	54.8	10	120	3	2026-03-30 14:07:40.134183+03
25	Hedp 	kg	28.4	20	85	3	2026-03-30 14:19:44.453834+03
32	Makro işçilik	Birey	78.80000000000001	5	3000	\N	2026-03-30 14:25:42.217357+03
39	Sales 	kg	953.1999999999999	100	100	10	2026-03-30 14:29:37.765232+03
54	Pembe türev boyası	kg	50	10	1430	6	2026-03-31 12:11:58.122862+03
27	Kostik 	kg	165	20	40	5	2026-03-30 14:21:22.569537+03
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.settings (key, value) FROM stdin;
company_name	Laves Kimya
company_sub	Uretim ve Isletme Yonetim Sistemi
kdv_rate	0.0
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.stock_movements (id, material_id, product_id, type, quantity, description, created_at) FROM stdin;
1	5	\N	in_	0.1	İlk stok girişi	2026-03-30 14:00:38.54134+03
2	6	\N	in_	40	İlk stok girişi	2026-03-30 14:02:29.029618+03
3	7	\N	in_	25	İlk stok girişi	2026-03-30 14:03:10.736757+03
4	8	\N	in_	56	İlk stok girişi	2026-03-30 14:03:40.612235+03
5	9	\N	in_	88	İlk stok girişi	2026-03-30 14:04:06.960408+03
6	10	\N	in_	7	İlk stok girişi	2026-03-30 14:05:20.438622+03
7	11	\N	in_	74	İlk stok girişi	2026-03-30 14:07:40.152506+03
8	12	\N	in_	2	İlk stok girişi	2026-03-30 14:08:11.900768+03
9	13	\N	in_	20	İlk stok girişi	2026-03-30 14:08:44.257571+03
10	14	\N	in_	5	İlk stok girişi	2026-03-30 14:09:32.489128+03
11	15	\N	in_	200	İlk stok girişi	2026-03-30 14:10:21.544355+03
12	16	\N	in_	1	İlk stok girişi	2026-03-30 14:10:56.812124+03
13	17	\N	in_	17	İlk stok girişi	2026-03-30 14:11:26.291995+03
14	18	\N	in_	10	İlk stok girişi	2026-03-30 14:13:33.187385+03
15	19	\N	in_	103	İlk stok girişi	2026-03-30 14:14:05.55132+03
16	20	\N	in_	70	İlk stok girişi	2026-03-30 14:14:43.040669+03
17	21	\N	in_	5	İlk stok girişi	2026-03-30 14:15:59.19382+03
18	22	\N	in_	101	İlk stok girişi	2026-03-30 14:16:42.014701+03
19	23	\N	in_	0.9	İlk stok girişi	2026-03-30 14:18:23.621544+03
20	24	\N	in_	730	İlk stok girişi	2026-03-30 14:19:09.494562+03
21	25	\N	in_	62	İlk stok girişi	2026-03-30 14:19:44.458833+03
22	26	\N	in_	10	İlk stok girişi	2026-03-30 14:20:36.598668+03
23	27	\N	in_	280	İlk stok girişi	2026-03-30 14:21:22.587083+03
24	28	\N	in_	5	İlk stok girişi	2026-03-30 14:22:34.846197+03
25	29	\N	in_	3	İlk stok girişi	2026-03-30 14:23:15.939867+03
26	30	\N	in_	15	İlk stok girişi	2026-03-30 14:23:45.616109+03
27	31	\N	in_	3	İlk stok girişi	2026-03-30 14:24:30.131314+03
28	32	\N	in_	1000	İlk stok girişi	2026-03-30 14:25:42.235766+03
29	33	\N	in_	0.2	İlk stok girişi	2026-03-30 14:26:20.916453+03
30	34	\N	in_	205	İlk stok girişi	2026-03-30 14:26:53.754426+03
31	36	\N	in_	10	İlk stok girişi	2026-03-30 14:27:41.428922+03
32	37	\N	in_	200	İlk stok girişi	2026-03-30 14:28:18.404062+03
33	38	\N	in_	4	İlk stok girişi	2026-03-30 14:28:49.857016+03
34	39	\N	in_	1006	İlk stok girişi	2026-03-30 14:29:37.769203+03
35	40	\N	in_	1	İlk stok girişi	2026-03-30 14:30:42.911288+03
36	41	\N	in_	3	İlk stok girişi	2026-03-30 14:31:21.36978+03
37	42	\N	in_	50	İlk stok girişi	2026-03-30 14:31:51.26479+03
38	43	\N	in_	100	İlk stok girişi	2026-03-30 14:32:59.864478+03
39	44	\N	in_	30	İlk stok girişi	2026-03-30 14:33:28.29162+03
40	45	\N	in_	30	İlk stok girişi	2026-03-30 14:34:08.145565+03
41	46	\N	in_	7	İlk stok girişi	2026-03-30 14:34:29.430038+03
42	47	\N	in_	15	İlk stok girişi	2026-03-30 14:35:00.165925+03
43	48	\N	in_	15	İlk stok girişi	2026-03-30 14:35:33.64487+03
44	49	\N	in_	50	İlk stok girişi	2026-03-30 14:36:06.556589+03
45	50	\N	in_	68	İlk stok girişi	2026-03-30 14:36:34.875479+03
46	51	\N	in_	10	İlk stok girişi	2026-03-30 14:37:02.969867+03
47	21	\N	in_	100	Manuel stok düzeltme	2026-03-30 17:30:49.432622+03
48	22	\N	in_	105	Manuel stok düzeltme	2026-03-30 17:31:06.720188+03
49	52	\N	in_	10	İlk stok girişi	2026-03-30 18:16:02.430242+03
50	53	\N	in_	5000	İlk stok girişi	2026-03-30 18:17:21.542644+03
51	6	\N	out	20	Üretim #4 - Pembe köpük x1.0	2026-03-31 11:07:19.030694+03
52	\N	4	in_	1	Üretim tamamlandı: Pembe köpük	2026-03-31 11:07:19.030694+03
53	34	\N	out	2	Üretim #6 - Detay temizleyici x200.0	2026-03-31 11:13:13.290908+03
54	27	\N	out	2	Üretim #6 - Detay temizleyici x200.0	2026-03-31 11:13:13.290908+03
55	42	\N	out	2	Üretim #6 - Detay temizleyici x200.0	2026-03-31 11:13:13.290908+03
56	8	\N	out	3	Üretim #6 - Detay temizleyici x200.0	2026-03-31 11:13:13.290908+03
57	53	\N	out	189	Üretim #6 - Detay temizleyici x200.0	2026-03-31 11:13:13.290908+03
58	\N	6	in_	200	Üretim tamamlandı: Detay temizleyici	2026-03-31 11:13:13.290908+03
59	6	\N	out	2.6	Üretim #3 - Beyaz köpük x650.0	2026-03-31 11:31:11.70497+03
60	9	\N	out	7.8	Üretim #3 - Beyaz köpük x650.0	2026-03-31 11:31:11.70497+03
61	25	\N	out	18.2	Üretim #3 - Beyaz köpük x650.0	2026-03-31 11:31:11.70497+03
62	39	\N	out	28.599999999999998	Üretim #3 - Beyaz köpük x650.0	2026-03-31 11:31:11.70497+03
63	11	\N	out	10.4	Üretim #3 - Beyaz köpük x650.0	2026-03-31 11:31:11.70497+03
64	8	\N	out	2.6	Üretim #3 - Beyaz köpük x650.0	2026-03-31 11:31:11.70497+03
65	27	\N	out	26	Üretim #3 - Beyaz köpük x650.0	2026-03-31 11:31:11.70497+03
66	32	\N	out	553.15	Üretim #3 - Beyaz köpük x650.0	2026-03-31 11:31:11.70497+03
67	\N	3	in_	650	Üretim tamamlandı: Beyaz köpük	2026-03-31 11:31:11.70497+03
68	22	\N	out	21.45	Üretim #7 - Lastik parlatıcısı x110.0	2026-03-31 11:44:49.239785+03
69	21	\N	out	14.96	Üretim #7 - Lastik parlatıcısı x110.0	2026-03-31 11:44:49.239785+03
70	30	\N	out	5.17	Üretim #7 - Lastik parlatıcısı x110.0	2026-03-31 11:44:49.239785+03
71	52	\N	out	1.9799999999999998	Üretim #7 - Lastik parlatıcısı x110.0	2026-03-31 11:44:49.239785+03
72	53	\N	out	32.23	Üretim #7 - Lastik parlatıcısı x110.0	2026-03-31 11:44:49.239785+03
73	47	\N	out	0.33	Üretim #7 - Lastik parlatıcısı x110.0	2026-03-31 11:44:49.239785+03
74	\N	7	in_	110	Üretim tamamlandı: Lastik parlatıcısı	2026-03-31 11:44:49.239785+03
75	22	\N	out	14.625	Üretim #7 - Lastik parlatıcısı x75.0	2026-03-31 11:44:50.597941+03
76	21	\N	out	10.200000000000001	Üretim #7 - Lastik parlatıcısı x75.0	2026-03-31 11:44:50.597941+03
77	30	\N	out	3.525	Üretim #7 - Lastik parlatıcısı x75.0	2026-03-31 11:44:50.597941+03
78	52	\N	out	1.3499999999999999	Üretim #7 - Lastik parlatıcısı x75.0	2026-03-31 11:44:50.597941+03
79	53	\N	out	21.974999999999998	Üretim #7 - Lastik parlatıcısı x75.0	2026-03-31 11:44:50.597941+03
80	47	\N	out	0.225	Üretim #7 - Lastik parlatıcısı x75.0	2026-03-31 11:44:50.597941+03
81	\N	7	in_	75	Üretim tamamlandı: Lastik parlatıcısı	2026-03-31 11:44:50.597941+03
82	32	\N	in_	100	Manuel stok düzeltme	2026-03-31 11:45:08.569503+03
83	6	\N	out	2.2	Üretim #3 - Beyaz köpük x550.0	2026-03-31 11:45:15.575914+03
84	9	\N	out	6.6000000000000005	Üretim #3 - Beyaz köpük x550.0	2026-03-31 11:45:15.575914+03
85	25	\N	out	15.4	Üretim #3 - Beyaz köpük x550.0	2026-03-31 11:45:15.575914+03
86	39	\N	out	24.2	Üretim #3 - Beyaz köpük x550.0	2026-03-31 11:45:15.575914+03
87	11	\N	out	8.8	Üretim #3 - Beyaz köpük x550.0	2026-03-31 11:45:15.575914+03
88	8	\N	out	2.2	Üretim #3 - Beyaz köpük x550.0	2026-03-31 11:45:15.575914+03
89	27	\N	out	22	Üretim #3 - Beyaz köpük x550.0	2026-03-31 11:45:15.575914+03
90	32	\N	out	468.05	Üretim #3 - Beyaz köpük x550.0	2026-03-31 11:45:15.575914+03
91	\N	3	in_	550	Üretim tamamlandı: Beyaz köpük	2026-03-31 11:45:15.575914+03
92	54	\N	in_	50	İlk stok girişi	2026-03-31 12:11:58.129832+03
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.suppliers (id, name, phone, email, address, created_at) FROM stdin;
3	Aura kimya			Aydın	2026-03-30 13:58:22.538565+03
4	Bahar kimya			Şanlıurfa	2026-03-30 13:58:38.083663+03
5	Badıllı kimya			Şanlıurfa	2026-03-30 13:58:52.171192+03
6	Türev kimya			İstanbul	2026-03-30 14:00:09.230075+03
7	Dede kimya				2026-03-30 14:12:32.108024+03
8	Şutim			Şanlıurfa	2026-03-30 14:15:35.88577+03
9	Aktarcı			Şanlıurfa	2026-03-30 14:20:30.643738+03
10	Peros beyaz kağıt fabrikası				2026-03-30 14:29:35.241549+03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: openpg
--

COPY public.users (id, username, email, hashed_password, role, is_active, created_at) FROM stdin;
2	user1	user1@erp.com	$2b$12$MeLAEc6Fa5Q.psKCRjkaieL3P4tvfODKAlRy16WZ8EJcg.7O6sJZG	user	t	2026-03-30 13:16:31.173533+03
1	admin	admin@erp.com	$2b$12$zBFeBBM/Y65FT0v4rr5meOEp8V9jYnMpLttRn.qMZJcGNNLgTVrHm	admin	t	2026-03-30 13:16:31.173533+03
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 205, true);


--
-- Name: bom_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.bom_items_id_seq', 60, true);


--
-- Name: boms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.boms_id_seq', 8, true);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.customers_id_seq', 7, true);


--
-- Name: debts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.debts_id_seq', 7, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.order_items_id_seq', 18, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.orders_id_seq', 18, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.payments_id_seq', 6, true);


--
-- Name: productions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.productions_id_seq', 12, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.products_id_seq', 18, true);


--
-- Name: raw_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.raw_materials_id_seq', 54, true);


--
-- Name: stock_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.stock_movements_id_seq', 92, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 10, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: openpg
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: bom_items bom_items_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_pkey PRIMARY KEY (id);


--
-- Name: boms boms_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.boms
    ADD CONSTRAINT boms_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: productions productions_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.productions
    ADD CONSTRAINT productions_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: raw_materials raw_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (key);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_activity_logs_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_activity_logs_id ON public.activity_logs USING btree (id);


--
-- Name: ix_bom_items_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_bom_items_id ON public.bom_items USING btree (id);


--
-- Name: ix_boms_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_boms_id ON public.boms USING btree (id);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_debts_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_debts_id ON public.debts USING btree (id);


--
-- Name: ix_order_items_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_order_items_id ON public.order_items USING btree (id);


--
-- Name: ix_orders_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_orders_id ON public.orders USING btree (id);


--
-- Name: ix_payments_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_payments_id ON public.payments USING btree (id);


--
-- Name: ix_productions_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_productions_id ON public.productions USING btree (id);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_raw_materials_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_raw_materials_id ON public.raw_materials USING btree (id);


--
-- Name: ix_stock_movements_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_stock_movements_id ON public.stock_movements USING btree (id);


--
-- Name: ix_suppliers_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_suppliers_id ON public.suppliers USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: openpg
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: openpg
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: openpg
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bom_items bom_items_bom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_bom_id_fkey FOREIGN KEY (bom_id) REFERENCES public.boms(id);


--
-- Name: bom_items bom_items_raw_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.bom_items
    ADD CONSTRAINT bom_items_raw_material_id_fkey FOREIGN KEY (raw_material_id) REFERENCES public.raw_materials(id);


--
-- Name: boms boms_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.boms
    ADD CONSTRAINT boms_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: productions productions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.productions
    ADD CONSTRAINT productions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: productions productions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.productions
    ADD CONSTRAINT productions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: raw_materials raw_materials_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.raw_materials
    ADD CONSTRAINT raw_materials_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: stock_movements stock_movements_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.raw_materials(id);


--
-- Name: stock_movements stock_movements_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: openpg
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- PostgreSQL database dump complete
--

