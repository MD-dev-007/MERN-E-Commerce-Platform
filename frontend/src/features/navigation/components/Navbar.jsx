import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Chip, Stack, useMediaQuery, useTheme, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserInfo } from '../../user/UserSlice';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { selectCartItems } from '../../cart/CartSlice';
import { selectLoggedInUser, logoutAsync } from '../../auth/AuthSlice';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TuneIcon from '@mui/icons-material/Tune';
import { selectProductIsFilterOpen, toggleFilters } from '../../products/ProductSlice';
import FavoriteIcon from '@mui/icons-material/Favorite';
import GavelIcon from '@mui/icons-material/Gavel';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export const Navbar = () => {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const userInfo = useSelector(selectUserInfo);
  const cartItems = useSelector(selectCartItems);
  const loggedInUser = useSelector(selectLoggedInUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const is480 = useMediaQuery(theme.breakpoints.down(480));

  const wishlistItems = useSelector(selectWishlistItems);
  const isProductFilterOpen = useSelector(selectProductIsFilterOpen);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    dispatch(logoutAsync());
    handleCloseUserMenu();
  };

  const handleToggleFilters = () => {
    dispatch(toggleFilters());
  };

  const settings = [
    { name: "Home", to: "/" },
    { name: 'Profile', to: loggedInUser?.isAdmin ? "/admin/profile" : "/profile" },
    { name: loggedInUser?.isAdmin ? 'Orders' : 'My orders', to: loggedInUser?.isAdmin ? "/admin/orders" : "/orders" },
    { name: 'Logout', to: "/logout" },
  ];

  return (
    <AppBar position="sticky">
      <Toolbar disableGutters>
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/"
          sx={{
            mr: 2,
            display: { xs: 'none', md: 'flex' },
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          HORIZON ART SHOP
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleOpenNavMenu}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{
              display: { xs: 'block', md: 'none' },
            }}
          >
            <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/') }}>
              <Typography textAlign="center">Home</Typography>
            </MenuItem>
            <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/products') }}>
              <Typography textAlign="center">Products</Typography>
            </MenuItem>
            <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/auctions') }}>
              <Typography textAlign="center">Auctions</Typography>
            </MenuItem>
          </Menu>
        </Box>

        <Typography
          variant="h5"
          noWrap
          component={Link}
          to="/"
          sx={{
            mr: 2,
            display: { xs: 'flex', md: 'none' },
            flexGrow: 1,
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          HORIZON ART SHOP
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          <Button
            onClick={() => navigate('/')}
            sx={{ my: 2, color: 'white', display: 'block' }}
          >
            Home
          </Button>
          <Button
            onClick={() => navigate('/products')}
            sx={{ my: 2, color: 'white', display: 'block' }}
          >
            Products
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton component={Link} to="/wishlist" sx={{ color: 'white' }}>
            <Badge badgeContent={wishlistItems?.length} color="error">
              <FavoriteBorderIcon />
            </Badge>
          </IconButton>

          {/* Auction Button */}
          <Button
            component={Link}
            to="/auctions"
            sx={{
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <GavelIcon />
            Auctions
          </Button>

          <IconButton component={Link} to="/cart" sx={{ color: 'white' }}>
            <Badge badgeContent={cartItems?.length} color="error">
              <ShoppingCartOutlinedIcon />
            </Badge>
          </IconButton>

          {loggedInUser ? (
            <>
              <IconButton
                onClick={handleOpenUserMenu}
                sx={{ p: 0, color: 'white' }}
              >
                <Avatar alt={userInfo?.name} src="null" />
              </IconButton>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {loggedInUser.isAdmin && (
                  <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/admin') }}>
                    <Typography textAlign="center">Admin Dashboard</Typography>
                  </MenuItem>
                )}
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile') }}>
                  <Typography textAlign="center">Profile</Typography>
                </MenuItem>
                <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/orders') }}>
                  <Typography textAlign="center">Orders</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              sx={{ color: 'white' }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}