import {
  Home, Search, Menu, Settings, SlidersHorizontal, LayoutDashboard, PanelsTopLeft, Grid2X2, List, Filter,
  ArrowRight, ArrowUpRight, ChevronDown, Plus, Check, X, ExternalLink, MoreHorizontal, Maximize, MousePointer2,
  Heart, Star, Bell, MessageCircle, MessageSquare, Mail, Send, Phone, Video, Users, User, UserPlus, Smile,
  ThumbsUp, Share2, Link, AtSign, Globe, Languages, Contact,
  ShoppingBag, ShoppingCart, Package, Gift, Tag, Ticket, Wallet, CreditCard, Coins, TrendingUp,
  ChartNoAxesCombined, ChartPie, Briefcase, Building2, Store, BadgeCheck, Award, Trophy, Target, Flag,
  Sparkles, WandSparkles, Palette, Paintbrush, PenTool, Pencil, Brush, Camera, Image, Film, Music,
  Headphones, Mic, Play, Pause, Volume2, Aperture, Layers, Shapes, Diamond,
  Laptop, Monitor, Smartphone, Tablet, Code2, Terminal, Database, Cloud, Server, Wifi, Bluetooth, Usb,
  Cpu, HardDrive, Folder, FileText, Download, Upload, LockKeyhole, ShieldCheck,
  Sun, Moon, CloudSun, CloudRain, Snowflake, Flame, Droplets, Leaf, Flower2, TreePine, Mountain,
  Waves, Wind, Rainbow, Feather, Bird, Cat, Dog, Rocket, Compass,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type LibraryIcon = { id: string; label: string; category: string; Component: LucideIcon; keywords: string };
type Item = [string, string, LucideIcon];
function category(name: string, items: Item[]): LibraryIcon[] {
  return items.map(([key, label, Component]) => ({ id: key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(), label, category: name, Component, keywords: `${key} ${label} ${name}`.toLowerCase() }));
}
// Explicit imports keep the catalogue offline and include only these selected icons.
export const iconLibrary: LibraryIcon[] = [
  ...category('Интерфейс', [
    ['Home','Главная',Home], ['Search','Поиск',Search], ['Menu','Меню',Menu], ['Settings','Настройки',Settings],
    ['SlidersHorizontal','Регуляторы',SlidersHorizontal], ['LayoutDashboard','Дашборд',LayoutDashboard], ['PanelsTopLeft','Панели',PanelsTopLeft], ['Grid2X2','Сетка',Grid2X2],
    ['List','Список',List], ['Filter','Фильтр',Filter], ['ArrowRight','Стрелка вправо',ArrowRight], ['ArrowUpRight','Стрелка вверх',ArrowUpRight],
    ['ChevronDown','Раскрыть',ChevronDown], ['Plus','Добавить',Plus], ['Check','Готово',Check], ['X','Закрыть',X],
    ['ExternalLink','Внешняя ссылка',ExternalLink], ['MoreHorizontal','Ещё',MoreHorizontal], ['Maximize','Развернуть',Maximize], ['MousePointer2','Курсор',MousePointer2],
  ]),
  ...category('Общение', [
    ['Heart','Сердце',Heart], ['Star','Звезда',Star], ['Bell','Уведомление',Bell], ['MessageCircle','Чат',MessageCircle],
    ['MessageSquare','Сообщение',MessageSquare], ['Mail','Письмо',Mail], ['Send','Отправить',Send], ['Phone','Телефон',Phone],
    ['Video','Видеозвонок',Video], ['Users','Команда',Users], ['User','Пользователь',User], ['UserPlus','Новый пользователь',UserPlus],
    ['Smile','Улыбка',Smile], ['ThumbsUp','Нравится',ThumbsUp], ['Share2','Поделиться',Share2], ['Link','Ссылка',Link],
    ['AtSign','Упоминание',AtSign], ['Globe','Мир',Globe], ['Languages','Языки',Languages], ['Contact','Контакт',Contact],
  ]),
  ...category('Бизнес', [
    ['ShoppingBag','Покупки',ShoppingBag], ['ShoppingCart','Корзина',ShoppingCart], ['Package','Посылка',Package], ['Gift','Подарок',Gift],
    ['Tag','Ценник',Tag], ['Ticket','Билет',Ticket], ['Wallet','Кошелёк',Wallet], ['CreditCard','Банковская карта',CreditCard],
    ['Coins','Монеты',Coins], ['TrendingUp','Рост',TrendingUp], ['ChartNoAxesCombined','График',ChartNoAxesCombined], ['ChartPie','Диаграмма',ChartPie],
    ['Briefcase','Портфель',Briefcase], ['Building2','Компания',Building2], ['Store','Магазин',Store], ['BadgeCheck','Подтверждено',BadgeCheck],
    ['Award','Награда',Award], ['Trophy','Кубок',Trophy], ['Target','Цель',Target], ['Flag','Флаг',Flag],
  ]),
  ...category('Творчество', [
    ['Sparkles','Искры',Sparkles], ['WandSparkles','Волшебная палочка',WandSparkles], ['Palette','Палитра',Palette], ['Paintbrush','Кисть',Paintbrush],
    ['PenTool','Перо',PenTool], ['Pencil','Карандаш',Pencil], ['Brush','Рисование',Brush], ['Camera','Камера',Camera],
    ['Image','Картинка',Image], ['Film','Кино',Film], ['Music','Музыка',Music], ['Headphones','Наушники',Headphones],
    ['Mic','Микрофон',Mic], ['Play','Воспроизвести',Play], ['Pause','Пауза',Pause], ['Volume2','Звук',Volume2],
    ['Aperture','Диафрагма',Aperture], ['Layers','Слои',Layers], ['Shapes','Фигуры',Shapes], ['Diamond','Бриллиант',Diamond],
  ]),
  ...category('Технологии', [
    ['Laptop','Ноутбук',Laptop], ['Monitor','Монитор',Monitor], ['Smartphone','Смартфон',Smartphone], ['Tablet','Планшет',Tablet],
    ['Code2','Код',Code2], ['Terminal','Терминал',Terminal], ['Database','База данных',Database], ['Cloud','Облако',Cloud],
    ['Server','Сервер',Server], ['Wifi','Беспроводная сеть',Wifi], ['Bluetooth','Блютуз',Bluetooth], ['Usb','USB',Usb],
    ['Cpu','Процессор',Cpu], ['HardDrive','Диск',HardDrive], ['Folder','Папка',Folder], ['FileText','Документ',FileText],
    ['Download','Загрузить',Download], ['Upload','Выгрузить',Upload], ['LockKeyhole','Замок',LockKeyhole], ['ShieldCheck','Защита',ShieldCheck],
  ]),
  ...category('Мир вокруг', [
    ['Sun','Солнце',Sun], ['Moon','Луна',Moon], ['CloudSun','Погода',CloudSun], ['CloudRain','Дождь',CloudRain],
    ['Snowflake','Снежинка',Snowflake], ['Flame','Огонь',Flame], ['Droplets','Вода',Droplets], ['Leaf','Лист',Leaf],
    ['Flower2','Цветок',Flower2], ['TreePine','Дерево',TreePine], ['Mountain','Горы',Mountain], ['Waves','Волны',Waves],
    ['Wind','Ветер',Wind], ['Rainbow','Радуга',Rainbow], ['Feather','Пёрышко',Feather], ['Bird','Птица',Bird],
    ['Cat','Кошка',Cat], ['Dog','Собака',Dog], ['Rocket','Ракета',Rocket], ['Compass','Компас',Compass],
  ]),
];
const iconMap = new Map(iconLibrary.map(icon => [icon.id, icon]));
export const findLibraryIcon = (id: string) => iconMap.get(id);
export function searchIcons(query: string, categoryName = 'Все') {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return iconLibrary.filter(icon => (categoryName === 'Все' || icon.category === categoryName) && words.every(word => icon.keywords.includes(word) || icon.id.includes(word)));
}
