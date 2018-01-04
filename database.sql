
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;


-- --------------------------------------------------------

--
-- Table structure for table `etl_opinie`
--

CREATE TABLE IF NOT EXISTS `etl_opinie` (
  `id` int(11) NOT NULL,
  `gwiazdki` varchar(250) COLLATE utf8_polish_ci NOT NULL,
  `autor` varchar(250) COLLATE utf8_polish_ci NOT NULL,
  `data` varchar(250) COLLATE utf8_polish_ci NOT NULL,
  `przydatne` int(11) NOT NULL,
  `nieprzydatne` int(11) NOT NULL,
  `rekomendacja` varchar(250) COLLATE utf8_polish_ci NOT NULL,
  `podsumowanie` longtext COLLATE utf8_polish_ci NOT NULL,
  `prod_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `etl_prod`
--

CREATE TABLE IF NOT EXISTS `etl_prod` (
  `id` int(11) NOT NULL,
  `marka` varchar(250) COLLATE utf8_polish_ci NOT NULL,
  `model` varchar(250) COLLATE utf8_polish_ci NOT NULL,
  `uwagi` longtext COLLATE utf8_polish_ci NOT NULL,
  `rodzaj` text COLLATE utf8_polish_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `etl_wady`
--

CREATE TABLE IF NOT EXISTS `etl_wady` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tresc` longtext COLLATE utf8_polish_ci NOT NULL,
  `opinia_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci AUTO_INCREMENT=281 ;

-- --------------------------------------------------------

--
-- Table structure for table `etl_zalety`
--

CREATE TABLE IF NOT EXISTS `etl_zalety` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tresc` longtext COLLATE utf8_polish_ci NOT NULL,
  `opinia_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_polish_ci AUTO_INCREMENT=1851 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
