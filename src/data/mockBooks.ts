export type BookStatus = "Lu" | "En cours" | "Dans ma PAL" | "Acheté" | "Abandonné" | "Wishlist" | "Lecture en cours" | "Lecture terminée" | "Prêté" | "Emprunté";

export interface Citation {
  id: string;
  text: string;
  page?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  rating?: number;
  coupDeCoeur?: boolean;
  status: string;
  secondaryStatus?: string;
  genre?: string;
  format?: string;
  publisher?: string;
  series?: string;
  pages?: number;
  pagesRead?: number;
  chapters?: number;
  publicationDate?: string;
  price?: number;
  spicyLevel?: number;
  matureContent?: boolean;
  recommandationDuMois?: boolean;
  recommandationMonth?: string; // "YYYY-MM"
  startDate?: string;
  endDate?: string;
  avis?: string;
  citations?: Citation[];
  passagesPreferes?: string;
  personnagesPreferes?: string;
  chapterNotes?: Record<number, string>;
  chapterNotesEnabled?: boolean;
  loanDate?: string;
  borrowerName?: string;
  borrowDate?: string;
  returnDate?: string;
  lenderName?: string;
  rereadCount?: number;
}

export const mockBooks: Book[] = [
  { id: "1", title: "L'Étranger", author: "Albert Camus", coverUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=180&h=244&fit=crop", rating: 5, coupDeCoeur: true, status: "Lecture terminée", genre: "Contemporain", format: "Poche", publisher: "Gallimard", pages: 185, pagesRead: 185, chapters: 6 },
  { id: "2", title: "Le Petit Prince", author: "Antoine de Saint-Exupéry", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=180&h=244&fit=crop", rating: 4, coupDeCoeur: false, status: "Lecture terminée", genre: "Fantasy", format: "Broché", publisher: "Gallimard", pages: 96, pagesRead: 96, chapters: 27 },
  { id: "3", title: "Les Misérables", author: "Victor Hugo", rating: 5, coupDeCoeur: true, status: "Lecture en cours", genre: "Historique", format: "Relié", publisher: "Hachette", pages: 1900, pagesRead: 450, chapters: 48 },
  { id: "4", title: "Germinal", author: "Émile Zola", coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=180&h=244&fit=crop", status: "Acheté", genre: "Historique", format: "Poche", publisher: "Flammarion", pages: 591, chapters: 7, spicyLevel: 2 },
  { id: "5", title: "Madame Bovary", author: "Gustave Flaubert", coverUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=180&h=244&fit=crop", rating: 3, status: "Dans ma PAL", genre: "Romance", format: "Broché", publisher: "Flammarion" },
  { id: "6", title: "La Peste", author: "Albert Camus", rating: 4, coupDeCoeur: true, status: "Lecture terminée", genre: "Contemporain", format: "Poche", publisher: "Gallimard" },
  { id: "7", title: "Candide", author: "Voltaire", coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=180&h=244&fit=crop", status: "Acheté", genre: "Historique", format: "Poche", publisher: "Hachette" },
  { id: "8", title: "Notre-Dame de Paris", author: "Victor Hugo", coverUrl: "https://images.unsplash.com/photo-1509266272358-7701da638078?w=180&h=244&fit=crop", rating: 4, status: "Lecture en cours", genre: "Historique", format: "Relié", publisher: "Hachette" },
  { id: "9", title: "Le Rouge et le Noir", author: "Stendhal", status: "Acheté", genre: "Romance", format: "Broché", publisher: "Flammarion" },
  { id: "10", title: "Bel-Ami", author: "Guy de Maupassant", coverUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=180&h=244&fit=crop", rating: 3, status: "Abandonné", genre: "Contemporain", format: "Poche", publisher: "Flammarion" },
  { id: "11", title: "Vingt mille lieues sous les mers", author: "Jules Verne", coverUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=180&h=244&fit=crop", rating: 5, coupDeCoeur: true, status: "Lecture terminée", genre: "Science-Fiction", format: "Relié", publisher: "Hetzel", series: "Voyages extraordinaires" },
  { id: "12", title: "Les Fleurs du mal", author: "Charles Baudelaire", status: "Dans ma PAL", genre: "Contemporain", format: "Poche", publisher: "Gallimard" },
  { id: "13", title: "Le Comte de Monte-Cristo", author: "Alexandre Dumas", coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=180&h=244&fit=crop", status: "Wishlist", genre: "Historique", format: "Relié", publisher: "Hachette" },
  { id: "14", title: "Cyrano de Bergerac", author: "Edmond Rostand", status: "Wishlist", genre: "Historique", format: "Broché", publisher: "Flammarion" },
];
