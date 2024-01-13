map' _ [] = []
map' f (x:xs) = f x : map f xs


add' :: Num a => a -> a -> a
add' a b = a + b

(filter (>4) . map (+3)) [1, 2, 3]